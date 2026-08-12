# Changelog

Todas as alterações relevantes deste projeto serão registradas neste arquivo.

O formato segue a ideia do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o versionamento utiliza versões explícitas do aplicativo.

## [2.3.0] - 2026-08-12

### Adicionado

- seleção de perfil de compatibilidade para **APAC Magnético 3.12c** e **4.00**;
- interface Desktop técnico profissional;
- detecção automática da competência do arquivo;
- seleção de mês e ano de destino;
- geração de arquivo `APOCI.<MÊS>`;
- validação estrutural dos registros atualmente homologados `01`, `14`, `06` e `13`;
- proteção contra alteração de bytes fora dos campos de competência autorizados;
- verificação de integridade por SHA-256;
- relatório de auditoria da conversão;
- pré-validação específica do perfil 3.12c para divergências conhecidas entre competência e data de encerramento;
- identificação do layout 04.00 no perfil atual;
- identidade discreta Gentill Mob Ops e site `www.gentillops.com.br`.

### Segurança

- arquivos reais de APAC, relatórios de consistência, dados privados, executáveis e pacotes de distribuição passam a ser bloqueados pelo `.gitignore` do repositório público;
- documentação reforça que exemplos públicos devem utilizar exclusivamente dados fictícios ou anonimizados.

### Observações

- o projeto é independente e não representa homologação oficial pelo DATASUS, Ministério da Saúde, SUS, MV/SoulMV ou outros fornecedores citados;
- a conversão não deve substituir a validação no ambiente oficial correspondente.
