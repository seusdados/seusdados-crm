#!/bin/bash

# Script para executar a migração do questionário LGPD

echo "Iniciando processo de migração do questionário LGPD..."

# Garantir que o diretório do script existe
mkdir -p scripts

# Executar o script de migração com ts-node
npx tsx scripts/migrate-lgpd-questionnaire.ts

echo "Processo de migração concluído."
