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
        const { email, password, fullName } = await req.json();

        if (!email || !password || !fullName) {
            throw new Error('Email, password and fullName are required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log('Updating admin user:', email);

        // First, get user by email
        const getUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!getUserResponse.ok) {
            const errorData = await getUserResponse.text();
            console.error('Get user error:', errorData);
            throw new Error(`Failed to get user: ${errorData}`);
        }

        const userData = await getUserResponse.json();
        
        if (!userData.users || userData.users.length === 0) {
            throw new Error('User not found');
        }

        const userId = userData.users[0].id;
        console.log('Found user with ID:', userId);

        // Update user password and metadata
        const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: password,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName,
                    role: 'admin'
                }
            })
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.text();
            console.error('Update user error:', errorData);
            throw new Error(`Failed to update user: ${errorData}`);
        }

        const updatedUser = await updateResponse.json();
        console.log('User updated successfully:', updatedUser.id);

        // Update the users table with admin role
        const updateUsersTableResponse = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${email}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: 'admin',
                full_name: fullName,
                name: fullName,
                department: 'Administração',
                is_active: true
            })
        });

        if (!updateUsersTableResponse.ok) {
            const errorText = await updateUsersTableResponse.text();
            console.error('Failed to update users table:', errorText);
            // Don't throw error here, main update was successful
        }

        const result = {
            data: {
                id: updatedUser.id,
                email: updatedUser.email,
                role: 'admin',
                message: 'Admin user updated successfully'
            }
        };

        console.log('Admin user update completed successfully');

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin user update error:', error);

        const errorResponse = {
            error: {
                code: 'ADMIN_USER_UPDATE_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});