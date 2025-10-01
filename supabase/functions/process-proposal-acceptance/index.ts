Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { proposalId, acceptanceData } = await req.json();

        if (!proposalId) {
            throw new Error('Proposal ID is required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log('Processing proposal acceptance for:', proposalId);

        // Get proposal details with related data
        const proposalResponse = await fetch(`${supabaseUrl}/rest/v1/proposals?id=eq.${proposalId}&select=*,clients(*),proposal_services(*)`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!proposalResponse.ok) {
            const errorText = await proposalResponse.text();
            throw new Error(`Failed to fetch proposal: ${errorText}`);
        }

        const proposals = await proposalResponse.json();
        if (!proposals || proposals.length === 0) {
            throw new Error('Proposal not found');
        }

        const proposal = proposals[0];
        console.log('Found proposal:', proposal.proposal_number);

        // Check if proposal is already accepted
        if (proposal.status === 'accepted') {
            console.log('Proposal already accepted, checking for existing contract...');
            
            // Check if contract already exists
            const existingContractResponse = await fetch(`${supabaseUrl}/rest/v1/contracts?proposal_id=eq.${proposalId}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (existingContractResponse.ok) {
                const existingContracts = await existingContractResponse.json();
                if (existingContracts && existingContracts.length > 0) {
                    return new Response(JSON.stringify({
                        data: {
                            message: 'Contract already exists for this proposal',
                            contract: existingContracts[0]
                        }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
            }
        }

        // Update proposal status to accepted
        const updateProposalResponse = await fetch(`${supabaseUrl}/rest/v1/proposals?id=eq.${proposalId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        if (!updateProposalResponse.ok) {
            const errorText = await updateProposalResponse.text();
            throw new Error(`Failed to update proposal: ${errorText}`);
        }

        console.log('Proposal status updated to accepted');

        // Generate contract number
        const contractNumber = await generateContractNumber(supabaseUrl, serviceRoleKey);
        
        // Calculate contract dates
        const startDate = proposal.contract_start_date || new Date().toISOString().split('T')[0];
        const endDate = proposal.contract_end_date || calculateEndDate(startDate, proposal.contract_duration_type);

        // Create contract
        const contractData = {
            contract_number: contractNumber,
            proposal_id: proposalId,
            client_id: proposal.client_id,
            consultant_id: proposal.consultant_id,
            total_value: proposal.total_amount,
            currency: proposal.currency || 'BRL',
            payment_method: proposal.payment_method,
            start_date: startDate,
            end_date: endDate,
            status: 'active',
            contract_terms: generateContractTerms(proposal),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const createContractResponse = await fetch(`${supabaseUrl}/rest/v1/contracts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(contractData)
        });

        if (!createContractResponse.ok) {
            const errorText = await createContractResponse.text();
            throw new Error(`Failed to create contract: ${errorText}`);
        }

        const contract = await createContractResponse.json();
        console.log('Contract created:', contract[0].contract_number);

        // Create contract services based on proposal services
        if (proposal.proposal_services && proposal.proposal_services.length > 0) {
            const contractServices = proposal.proposal_services.map((service: any) => ({
                contract_id: contract[0].id,
                service_id: service.service_id,
                quantity: service.quantity,
                unit_price: service.unit_price,
                total_price: service.total_price,
                description: service.description,
                created_at: new Date().toISOString()
            }));

            const createServicesResponse = await fetch(`${supabaseUrl}/rest/v1/contract_services`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contractServices)
            });

            if (!createServicesResponse.ok) {
                console.warn('Failed to create contract services, but contract was created successfully');
            } else {
                console.log('Contract services created successfully');
            }
        }

        const result = {
            data: {
                message: 'Proposal accepted and contract created successfully',
                proposal: {
                    id: proposalId,
                    status: 'accepted',
                    accepted_at: new Date().toISOString()
                },
                contract: contract[0]
            }
        };

        console.log('Process completed successfully');

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Proposal acceptance processing error:', error);

        const errorResponse = {
            error: {
                code: 'PROPOSAL_ACCEPTANCE_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to generate unique contract number
async function generateContractNumber(supabaseUrl: string, serviceRoleKey: string): Promise<string> {
    const year = new Date().getFullYear();
    const yearSuffix = year.toString().slice(-2);
    
    // Get the count of contracts this year
    const countResponse = await fetch(`${supabaseUrl}/rest/v1/contracts?select=count&contract_number=like.%${yearSuffix}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });
    
    let count = 1;
    if (countResponse.ok) {
        const result = await countResponse.json();
        count = (result[0]?.count || 0) + 1;
    }
    
    // Format: CONT-YYYYNNNN (e.g., CONT-24-0001)
    return `CONT-${yearSuffix}-${count.toString().padStart(4, '0')}`;
}

// Helper function to calculate end date based on duration
function calculateEndDate(startDate: string, durationType: string): string {
    const start = new Date(startDate);
    let end = new Date(start);
    
    switch (durationType) {
        case 'monthly':
            end.setMonth(end.getMonth() + 1);
            break;
        case 'quarterly':
            end.setMonth(end.getMonth() + 3);
            break;
        case 'biannual':
            end.setMonth(end.getMonth() + 6);
            break;
        case 'annual':
            end.setFullYear(end.getFullYear() + 1);
            break;
        default:
            // Default to 12 months
            end.setFullYear(end.getFullYear() + 1);
    }
    
    return end.toISOString().split('T')[0];
}

// Helper function to generate contract terms
function generateContractTerms(proposal: any): any {
    return {
        payment_method: proposal.payment_method,
        total_amount: proposal.total_amount,
        currency: proposal.currency || 'BRL',
        discount_percentage: proposal.discount_percentage || 0,
        duration_type: proposal.contract_duration_type,
        start_date: proposal.contract_start_date,
        end_date: proposal.contract_end_date,
        services: proposal.proposal_services || [],
        client_data: proposal.clients,
        proposal_data: proposal.proposal_data || {},
        generated_at: new Date().toISOString()
    };
}