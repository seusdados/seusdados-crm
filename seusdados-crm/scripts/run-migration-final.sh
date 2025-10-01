#!/bin/bash

# Script para executar a migração do questionário LGPD

echo "Iniciando processo de migração do questionário LGPD..."

# Executar o script de migração final
npx tsx scripts/migrate-lgpd-questionnaire-final.ts

echo "Processo de migração concluído."
