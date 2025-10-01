# 📋 Exemplos de Arquivos para Importação

## 🎯 JSON - Exemplo Completo ✅

### Questionário de Avaliação de Empresa

```json
{
  "sections": [
    {
      "title": "Informações Pessoais",
      "description": "Dados básicos do respondente",
      "order": 1,
      "questions": [
        {
          "text": "Qual é o seu nome completo?",
          "type": "text",
          "required": true,
          "order": 1,
          "description": "Nome completo para identificação"
        },
        {
          "text": "Qual é a sua idade?",
          "type": "number",
          "required": true,
          "order": 2
        },
        {
          "text": "Qual é o seu cargo na empresa?",
          "type": "single_choice",
          "required": true,
          "order": 3,
          "options": [
            "Estagiário",
            "Analista Jr",
            "Analista Pleno",
            "Analista Sr",
            "Coordenador",
            "Gerente",
            "Diretor"
          ]
        },
        {
          "text": "Data de admissão:",
          "type": "date",
          "required": false,
          "order": 4
        }
      ]
    },
    {
      "title": "Avaliação do Ambiente de Trabalho",
      "description": "Como você avalia o ambiente de trabalho",
      "order": 2,
      "questions": [
        {
          "text": "Como você avalia o clima organizacional?",
          "type": "single_choice",
          "required": true,
          "order": 1,
          "options": ["Excelente", "Bom", "Regular", "Ruim", "Péssimo"]
        },
        {
          "text": "Quais benefícios você considera mais importantes?",
          "type": "multiple_choice",
          "required": true,
          "order": 2,
          "options": [
            "Plano de saúde",
            "Vale alimentação",
            "Vale transporte",
            "Flexibilidade de horário",
            "Home office",
            "Plano odontológico",
            "Seguro de vida"
          ]
        },
        {
          "text": "Você se sente valorizado na empresa?",
          "type": "boolean",
          "required": true,
          "order": 3
        },
        {
          "text": "Descreva os pontos que podem ser melhorados:",
          "type": "textarea",
          "required": false,
          "order": 4,
          "description": "Seja específico e construtivo em suas sugestões"
        }
      ]
    },
    {
      "title": "Desenvolvimento Profissional",
      "description": "Oportunidades de crescimento e desenvolvimento",
      "order": 3,
      "questions": [
        {
          "text": "A empresa oferece oportunidades de crescimento?",
          "type": "single_choice",
          "required": true,
          "order": 1,
          "options": ["Sempre", "Frequentemente", "Às vezes", "Raramente", "Nunca"]
        },
        {
          "text": "Que tipo de treinamento você gostaria de receber?",
          "type": "multiple_choice",
          "required": false,
          "order": 2,
          "options": [
            "Liderança",
            "Tecnologia",
            "Comunicação",
            "Gestão de projetos",
            "Idiomas",
            "Vendas",
            "Marketing digital"
          ]
        },
        {
          "text": "De 1 a 10, qual nota você dá para seu desenvolvimento profissional na empresa?",
          "type": "number",
          "required": true,
          "order": 3,
          "description": "Sendo 1 = muito baixo e 10 = excelente"
        }
      ]
    }
  ]
}
```

## 📝 TXT - Exemplo Estruturado 🔄

### Questionário de Satisfação do Cliente

```text
PESQUISA DE SATISFAÇÃO - ATENDIMENTO AO CLIENTE

## DADOS DO CLIENTE

1. Nome completo:
2. E-mail para contato:
3. Telefone:
4. Cidade onde reside:

## AVALIAÇÃO DO ATENDIMENTO

5. Como você nos conheceu?
   a) Indicação de amigos
   b) Redes sociais
   c) Google/Internet
   d) Publicidade
   e) Outros

6. Qual serviço você utilizou?
   a) Consultoria empresarial
   b) Auditoria
   c) Contabilidade
   d) Jurídico
   e) Marketing digital

7. Como você avalia a qualidade do atendimento recebido?
   a) Excelente
   b) Muito bom
   c) Bom
   d) Regular
   e) Ruim

8. O profissional que te atendeu foi prestativo?
   a) Sim, sempre
   b) Na maioria das vezes
   c) Às vezes
   d) Raramente
   e) Não

9. Você recomendaria nossos serviços?

10. Qual a probabilidade de você nos contratar novamente?
    a) Muito alta
    b) Alta
    c) Média
    d) Baixa
    e) Muito baixa

## FEEDBACK E SUGESTÕES

11. O que mais gostou em nosso atendimento?

12. O que pode ser melhorado?

13. Sugestões adicionais ou comentários:

14. Gostaria de receber ofertas especiais por e-mail?
```

## 📄 TXT - Formato Simples 🔄

### Lista de Perguntas Básicas

```text
Qual é o seu nome?
Qual é a sua idade?
Onde você mora?
Qual é a sua profissão?
Você tem filhos?
Pratica algum esporte?
Qual é o seu hobby favorito?
Como você avalia nossa empresa?
Você nos recomendaria?
Comentários adicionais:
```

## 🎯 JSON - Formato Simplificado ✅

### Array de Perguntas

```json
[
  {
    "question": "Nome completo:",
    "type": "text",
    "required": true
  },
  {
    "question": "Como você avalia nosso serviço?",
    "type": "single_choice",
    "options": ["Excelente", "Bom", "Regular", "Ruim"],
    "required": true
  },
  {
    "question": "Deixe seus comentários:",
    "type": "textarea",
    "required": false
  }
]
```

## 📊 JSON - Formato Google Forms ✅

### Estrutura Similar ao Google Forms

```json
{
  "form": {
    "title": "Pesquisa de Mercado",
    "description": "Ajude-nos a entender melhor nossos clientes",
    "items": [
      {
        "title": "Informações Básicas",
        "type": "section",
        "questions": [
          {
            "questionText": "Qual é a sua faixa etária?",
            "questionType": "CHOICE",
            "required": true,
            "choices": [
              "18-25 anos",
              "26-35 anos", 
              "36-45 anos",
              "46-60 anos",
              "Acima de 60 anos"
            ]
          },
          {
            "questionText": "Gênero:",
            "questionType": "CHOICE",
            "required": false,
            "choices": ["Masculino", "Feminino", "Prefiro não informar"]
          }
        ]
      },
      {
        "title": "Preferências de Produto",
        "type": "section",
        "questions": [
          {
            "questionText": "Quais produtos você mais compra online?",
            "questionType": "CHECKBOX",
            "required": true,
            "choices": [
              "Roupas e acessórios",
              "Eletrônicos",
              "Livros",
              "Casa e decoração",
              "Esportes",
              "Beleza e cuidados"
            ]
          },
          {
            "questionText": "Qual é o seu orçamento mensal para compras online?",
            "questionType": "SCALE",
            "required": true,
            "scaleMin": 1,
            "scaleMax": 5,
            "scaleLabels": ["Até R$ 100", "R$ 101-300", "R$ 301-500", "R$ 501-1000", "Acima de R$ 1000"]
          }
        ]
      }
    ]
  }
}
```

## 🎨 JSON - Questionário com Lógica Condicional ✅

### Pesquisa com Direcionamentos

```json
{
  "sections": [
    {
      "title": "Triagem Inicial",
      "order": 1,
      "questions": [
        {
          "text": "Você já é nosso cliente?",
          "type": "boolean",
          "required": true,
          "order": 1,
          "conditional_logic": [
            {
              "condition": "response === true",
              "action": "jump_to",
              "target_section_id": "cliente_existente"
            },
            {
              "condition": "response === false", 
              "action": "jump_to",
              "target_section_id": "novo_cliente"
            }
          ]
        }
      ]
    },
    {
      "title": "Cliente Existente",
      "order": 2,
      "section_id": "cliente_existente",
      "questions": [
        {
          "text": "Há quanto tempo é nosso cliente?",
          "type": "single_choice",
          "options": ["Menos de 6 meses", "6 meses a 1 ano", "1 a 2 anos", "Mais de 2 anos"],
          "required": true,
          "order": 1
        },
        {
          "text": "Como avalia nosso atendimento?",
          "type": "single_choice",
          "options": ["Excelente", "Bom", "Regular", "Ruim"],
          "required": true,
          "order": 2
        }
      ]
    },
    {
      "title": "Novo Cliente",
      "order": 3,
      "section_id": "novo_cliente", 
      "questions": [
        {
          "text": "Como nos conheceu?",
          "type": "single_choice",
          "options": ["Indicação", "Internet", "Redes sociais", "Publicidade"],
          "required": true,
          "order": 1
        },
        {
          "text": "O que mais lhe interessa em nossos serviços?",
          "type": "multiple_choice",
          "options": ["Preço", "Qualidade", "Atendimento", "Prazo de entrega"],
          "required": true,
          "order": 2
        }
      ]
    }
  ]
}
```

## 🧪 Comandos de Teste

### 1. Teste JSON Completo

```bash
curl -X POST https://poppadzpyftjkergccpn.supabase.co/functions/v1/import-questionnaire \
  -H "Content-Type: application/json" \
  -d @exemplo-json-completo.json
```

### 2. Teste TXT Estruturado

```bash
curl -X POST https://poppadzpyftjkergccpn.supabase.co/functions/v1/import-questionnaire \
  -H "Content-Type: application/json" \
  -d '{
    "file_content": "SEÇÃO 1\n\n1. Pergunta 1?\n2. Pergunta 2?\n\nSEÇÃO 2\n\n3. Pergunta 3?\na) Opção A\nb) Opção B",
    "file_type": "txt",
    "questionnaire_title": "Teste TXT",
    "options": {"auto_detect_structure": true}
  }'
```

### 3. Teste JSON Simplificado

```bash
curl -X POST https://poppadzpyftjkergccpn.supabase.co/functions/v1/import-questionnaire \
  -H "Content-Type: application/json" \
  -d '{
    "file_content": "[{\"question\": \"Nome?\", \"type\": \"text\"}, {\"question\": \"Idade?\", \"type\": \"number\"}]",
    "file_type": "json",
    "questionnaire_title": "Teste Simples"
  }'
```

## 📋 Templates Prontos

### 1. Avaliação de Funcionário
- Dados pessoais
- Desempenho profissional  
- Satisfação com a empresa
- Desenvolvimento de carreira

### 2. Pesquisa de Satisfação
- Informações do cliente
- Avaliação do produto/serviço
- Experiência de compra
- Feedback e sugestões

### 3. Questionário Demográfico
- Idade e gênero
- Localização
- Educação
- Renda familiar

### 4. Avaliação de Evento
- Dados do participante
- Avaliação geral
- Palestrantes e conteúdo
- Organização e logística

### 5. Feedback de Curso
- Informações do aluno
- Conteúdo programático
- Metodologia de ensino
- Infraestrutura

---

**Nota**: Os exemplos JSON estão 100% funcionais. Os exemplos TXT estão em fase de melhoria do parser.

**Autor**: MiniMax Agent  
**Data**: 2025-09-30