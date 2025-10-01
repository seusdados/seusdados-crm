#!/bin/bash

# Script para executar a migração do questionário LGPD

echo "Iniciando processo de migração do questionário LGPD..."

# Solicitar a senha do administrador
read -s -p "Digite a senha do administrador (joao@seusdados.com.br): " ADMIN_PASSWORD
echo ""

# Garantir que o diretório do script existe
mkdir -p scripts

# Executar o script de migração atualizado com ts-node
ADMIN_PASSWORD="$ADMIN_PASSWORD" npx tsx scripts/migrate-lgpd-questionnaire-updated.ts

echo "Processo de migração concluído."
