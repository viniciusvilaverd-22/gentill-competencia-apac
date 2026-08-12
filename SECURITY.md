# Política de Segurança

## Dados sensíveis

Este projeto trabalha com arquivos que podem conter dados pessoais e dados pessoais sensíveis de saúde.

**Nunca publique em issues, pull requests, commits, exemplos ou capturas de tela arquivos reais de pacientes.**

Isso inclui, entre outros:

- arquivos `APOCI.*` de produção;
- relatórios `RCONSIST*` e `R0401*` reais;
- nomes de pacientes;
- CNS, CPF e outros identificadores;
- datas de nascimento;
- endereços e telefones;
- informações assistenciais e procedimentos;
- números reais de APAC.

Use somente dados fictícios ou completamente anonimizados em material público.

## Relato de vulnerabilidades

Não abra uma issue pública contendo detalhes exploráveis, segredos ou dados reais.

Quando disponível no GitHub, utilize o recurso privado **Report a vulnerability / Security Advisory** do repositório. Caso esse recurso não esteja disponível, entre em contato com o mantenedor por um canal privado antes de divulgar detalhes técnicos.

## Escopo

São especialmente relevantes relatos envolvendo:

- alteração de bytes fora dos campos autorizados;
- corrupção silenciosa de arquivos;
- validação incorreta de estrutura;
- exposição de dados locais;
- execução inesperada de código;
- bypass das verificações de integridade;
- vulnerabilidades no executável distribuído.

## Responsabilidade operacional

O software é uma ferramenta independente. Arquivos convertidos devem ser validados no processo oficial correspondente antes de utilização em produção.

Site do projeto: https://www.gentillops.com.br
