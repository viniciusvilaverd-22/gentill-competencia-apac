# Changelog

Todas as alterações relevantes deste projeto serão registradas neste arquivo.

O formato segue a ideia do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o versionamento utiliza versões explícitas do aplicativo.

## [2.4.1] - 2026-08-12

### Corrigido

- removida a seleção automática de competência baseada nas datas de encerramento;
- a competência realmente gravada no arquivo agora permanece como origem ao carregar;
- o mês/ano de destino é sempre escolhido manualmente pelo operador;
- as datas de encerramento são exibidas somente como diagnóstico de leitura;
- removida a lógica que podia dar a impressão de inverter a competência automaticamente;
- mantida a pré-validação da crítica `010082` antes da geração;
- mantido o bloqueio para arquivo com encerramentos em competências diferentes;
- adicionada verificação pós-conversão garantindo que todas as datas de encerramento permaneçam byte a byte idênticas.

### Segurança

- nenhuma data assistencial é criada, inferida, invertida ou reescrita;
- somente os campos estruturais de competência homologados podem ser modificados;
- o self-test do executável falha se a lógica de seleção automática de competência reaparecer.

## [2.4.0] - 2026-08-12

### Adicionado

- módulo **Validador OCI/PMAE**;
- análise das datas de encerramento presentes nos registros `14`;
- recomendação automática de competência quando todas as APACs válidas apontam para o mesmo mês;
- seleção automática da competência recomendada quando a competência gravada diverge dos encerramentos;
- bloqueio de geração quando o destino selecionado não corresponde à competência indicada pelos encerramentos;
- bloqueio de conversão automática para arquivos com APACs encerradas em competências distintas;
- painel visual de diagnóstico com competência gravada, competência recomendada e intervalo de encerramentos;
- pré-validação da crítica `010082` para o perfil APAC Magnético 3.12c;
- aplicação preventiva da mesma consistência no perfil APAC Magnético 4.00;
- auditoria explícita da quantidade de datas assistenciais alteradas (`0`).

### Alterado

- o perfil 3.12c deixou de permitir confirmação para gerar arquivo sabidamente incompatível com os encerramentos;
- a validação de encerramento x competência passou a ser regra de segurança dos dois perfis;
- o fluxo visual passou a destacar o diagnóstico da competência antes da conversão;
- a documentação foi atualizada para registrar que uma remessa APAC pode ter competência de apresentação diferente do período da fatura.

### Segurança

- datas de início, validade, ocorrência/encerramento, solicitação e autorização continuam protegidas e não são reescritas pela conversão;
- o conversor continua validando que nenhum byte fora dos campos estruturais de competência seja modificado;
- a geração final é revalidada contra os encerramentos antes da liberação do arquivo.

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