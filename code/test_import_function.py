#!/usr/bin/env python3

import requests
import time
import json
import os

def test_edge_function_with_auth():
    """
    Testa a Edge Function import-questionnaire com FormData real e autenticação,
    simulando exatamente o comportamento do frontend
    """
    
    # URL da função
    url = "https://poppadzpyftjkergccpn.supabase.co/functions/v1/import-questionnaire"
    
    # Token de autenticação
    auth_token = os.environ.get('SUPABASE_ACCESS_TOKEN')
    if not auth_token:
        print("❌ Token de autenticação não encontrado")
        return False
    
    # Carregar o arquivo de teste
    with open('/workspace/test_questionnaire.json', 'r', encoding='utf-8') as f:
        file_content = f.read()
    
    # Preparar FormData (simulando o que o frontend faz)
    files = {
        'file': ('test_questionnaire.json', file_content, 'application/json')
    }
    
    # Preparar opções de importação (como o frontend faz)
    data = {
        'import_options': json.dumps({
            "create_new_questionnaire": True,
            "merge_with_existing": False,
            "preserve_ids": False
        })
    }
    
    # Headers (usando a chave anônima em vez do token OAuth)
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcHBhZHpweWZ0amtlcmdjY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDUzODYsImV4cCI6MjA3MTE4MTM4Nn0.ExLR9dipmd8XvOzSafxYFF9Y5JFBoUfLia8splbgaVc"
    
    headers = {
        'Authorization': f'Bearer {anon_key}',
        'apikey': anon_key,
        'User-Agent': 'SeusDados-CRM-Test/1.0'
    }
    
    print("🔍 Testando Edge Function import-questionnaire com autenticação...")
    print(f"📍 URL: {url}")
    print(f"📁 Arquivo: test_questionnaire.json ({len(file_content)} chars)")
    print(f"🔐 Token: {auth_token[:20]}...")
    print("⏳ Enviando requisição...")
    
    start_time = time.time()
    
    try:
        # Fazer a requisição com timeout de 60 segundos
        response = requests.post(
            url, 
            files=files, 
            data=data, 
            headers=headers,
            timeout=60
        )
        
        end_time = time.time()
        elapsed = end_time - start_time
        
        print(f"⏱️  Tempo de resposta: {elapsed:.2f} segundos")
        print(f"📊 Status Code: {response.status_code}")
        print(f"📋 Headers da resposta:")
        for key, value in response.headers.items():
            print(f"   {key}: {value}")
        
        print(f"\n📄 Corpo da resposta:")
        
        try:
            response_json = response.json()
            print(json.dumps(response_json, indent=2, ensure_ascii=False))
        except:
            print(response.text)
            
        # Verificar se foi bem-sucedida
        if response.status_code == 200:
            print("✅ Teste bem-sucedido!")
            return True
        else:
            print("❌ Teste falhou com erro HTTP")
            return False
            
    except requests.exceptions.Timeout:
        end_time = time.time()
        elapsed = end_time - start_time
        print(f"⏱️  Timeout após {elapsed:.2f} segundos")
        print("❌ A requisição está demorando mais que 60 segundos (timeout)")
        print("🔧 Este é provavelmente o problema que causa o loop infinito no frontend!")
        return False
        
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Erro de conexão: {e}")
        return False
        
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def test_without_auth():
    """
    Testa sem autenticação para ver a diferença
    """
    url = "https://poppadzpyftjkergccpn.supabase.co/functions/v1/import-questionnaire"
    
    with open('/workspace/test_questionnaire.json', 'r', encoding='utf-8') as f:
        file_content = f.read()
    
    files = {
        'file': ('test_questionnaire.json', file_content, 'application/json')
    }
    
    data = {
        'import_options': json.dumps({
            "create_new_questionnaire": True,
            "merge_with_existing": False,
            "preserve_ids": False
        })
    }
    
    headers = {
        'User-Agent': 'SeusDados-CRM-Test/1.0'
    }
    
    print("\n🔍 Testando sem autenticação para comparação...")
    
    start_time = time.time()
    
    try:
        response = requests.post(
            url, 
            files=files, 
            data=data, 
            headers=headers,
            timeout=10
        )
        
        end_time = time.time()
        elapsed = end_time - start_time
        
        print(f"⏱️  Tempo de resposta: {elapsed:.2f} segundos")
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Resposta rápida de 401 - função está funcionando")
            return True
        else:
            print(f"❓ Resposta inesperada: {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Timeout mesmo sem autenticação - problema na função!")
        return False
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testando Edge Function import-questionnaire...")
    
    # Teste 1: Sem autenticação (deve ser rápido)
    quick_test = test_without_auth()
    
    # Teste 2: Com autenticação (pode estar com problema)
    auth_test = test_edge_function_with_auth()
    
    if quick_test and not auth_test:
        print("\n🔍 DIAGNÓSTICO:")
        print("- A função responde rapidamente para requests não autenticados")
        print("- A função trava ou demora para requests autenticados")
        print("- Este comportamento explica o loop infinito no frontend")
        print("\n💡 SOLUÇÃO NECESSÁRIA:")
        print("- Investigar problema de autenticação na Edge Function")
        print("- Verificar processamento de dados autenticados")
        print("- Adicionar timeout/error handling melhorado")
    elif not quick_test:
        print("\n🔍 DIAGNÓSTICO:")
        print("- A função está com problemas gerais (não específicos de auth)")
        print("- Pode haver loop infinito ou processamento muito lento")
    elif auth_test:
        print("\n🎉 DIAGNÓSTICO:")
        print("- A função está funcionando corretamente")
        print("- O problema pode estar no frontend ou em outra parte")
    
    exit(0 if auth_test else 1)