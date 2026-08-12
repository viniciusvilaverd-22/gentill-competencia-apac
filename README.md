# Gentill Competência APAC

Utilitário desktop/web local para Windows desenvolvido para auxiliar na **validação e alteração controlada da competência de arquivos APOCI utilizados em fluxos do APAC Magnético**.

> **Ferramenta independente — não oficial DATASUS/MV.**

O sistema identifica os campos estruturais de competência conhecidos, analisa a coerência com as datas de encerramento presentes nos registros APAC e aplica somente alterações autorizadas, preservando os demais dados.

**Versão atual documentada:** `2.4.0 — Validador OCI/PMAE`

## Principais recursos

- seleção do arquivo APOCI;
- detecção automática da competência gravada no arquivo;
- diagnóstico automático das datas de encerramento dos registros `14`;
- recomendação da competência quando todas as APACs analisadas apontam para o mesmo mês;
- bloqueio de destino incompatível com os encerramentos, prevenindo a crítica `010082` observada no APAC Magnético 3.12c;
- bloqueio de conversão automática quando o arquivo contém APACs encerradas em competências diferentes;
- seleção de perfil de compatibilidade:
  - **APAC Magnético 3.12c**;
  - **APAC Magnético 4.00**;
- geração automática do arquivo com extensão correspondente, como `APOCI.JUN`, `APOCI.JUL` ou `APOCI.AGO`;
- validação estrutural dos registros atualmente homologados:
  - `01`;
  - `14`;
  - `06`;
  - `13`;
- preservação binária dos campos que não pertencem à competência;
- nenhuma substituição global indiscriminada de datas ou números;
- geração de relatório de auditoria;
- verificação de integridade por SHA-256;
- operação local e offline;
- interface Desktop técnico profissional.

## Validação OCI/PMAE

A v2.4 introduz uma camada de diagnóstico específica para o cenário em que a **competência gravada no arquivo não corresponde ao mês da data de encerramento das APACs**.

Exemplo:

```text
Competência gravada:       07/2026
Encerramentos encontrados: 06/2026
Competência recomendada:   06/2026
```

Nesse cenário, o sistema recomenda `JUN/2026` e bloqueia a geração para `JUL/2026`.

Se o arquivo apresentar encerramentos em mais de uma competência, por exemplo:

```text
6 APACs em 06/2026
3 APACs em 07/2026
```

a conversão automática para uma única competência é bloqueada. O arquivo deve ser revisado/separado antes da geração.

### Regra de segurança

A recomendação de competência **não autoriza a alteração de datas assistenciais**.

A aplicação não modifica automaticamente:

- data inicial;
- data final de validade;
- data de ocorrência/encerramento;
- datas de solicitação e autorização;
- número da APAC;
- paciente, CNS ou CNES;
- CID;
- procedimentos e quantidades;
- demais campos assistenciais/administrativos.

Somente os campos estruturais de competência previamente homologados são reescritos.

## Perfis de compatibilidade

### APAC Magnético 3.12c

Perfil destinado a ambientes legados.

A divergência entre a competência apresentada e a data de encerramento foi reproduzida em ambiente 3.12c com a crítica:

```text
010082 — DATA DE ENCERRAMENTO DIFERENTE DA COMPETENCIA
```

Por esse motivo, a v2.4 bloqueia a geração quando o destino não corresponde à competência indicada pelos encerramentos.

### APAC Magnético 4.00

Perfil destinado ao layout 04.00 analisado pelo projeto.

A mesma consistência é aplicada preventivamente. O sistema também verifica a identificação da versão no cabeçalho e mantém as alterações restritas aos campos homologados.

## Contexto de competência de apresentação no SoulMV

Durante a análise do fluxo OCI/PMAE foi identificado que uma fatura pode possuir período de julho enquanto uma remessa APAC possui **competência de apresentação de junho**.

Esse cenário reforça que a competência de apresentação da remessa não deve ser inferida apenas pelo mês da fatura.

A ferramenta não acessa o banco SoulMV e não altera dados no banco. A validação é feita exclusivamente sobre o arquivo selecionado pelo operador.

## Código-fonte

A versão pública está organizada em três arquivos simples e auditáveis:

- `src/index.html` — interface e estrutura da aplicação;
- `src/styles.css` — identidade visual Desktop técnico;
- `src/app.js` — validação, diagnóstico, conversão e auditoria.

Para inspecionar a aplicação localmente, clone o repositório e abra `src/index.html` em um navegador compatível.

O repositório **não contém arquivos reais de pacientes** e não deve receber esse tipo de dado em commits, issues ou pull requests.

## Fluxo básico

1. Abra o Gentill Competência APAC.
2. Selecione a versão do APAC Magnético utilizada.
3. Escolha o arquivo APOCI.
4. Confira a competência gravada.
5. Confira o diagnóstico das datas de encerramento.
6. Se houver recomendação, revise a competência sugerida.
7. Selecione/aceite a competência de destino.
8. Valide a estrutura.
9. Gere a nova cópia.
10. Confira o relatório de auditoria.
11. Valide o arquivo no ambiente APAC Magnético correspondente antes de qualquer utilização definitiva.

## Estrutura do repositório

```text
.
├── src/
│   ├── app.js          # Motor de validação/conversão
│   ├── index.html      # Interface principal
│   └── styles.css      # Estilos Desktop técnico
├── .gitignore          # Proteção contra build, segredos e dados APAC reais
├── CHANGELOG.md        # Histórico das versões
├── CONTRIBUTING.md     # Regras para contribuições públicas
├── LICENSE             # Apache License 2.0
├── NOTICE              # Autoria, independência e marcas de terceiros
├── README.md           # Documentação principal
└── SECURITY.md         # Política de segurança e proteção de dados
```

Binários (`.exe`) e pacotes (`.zip`) não devem ser versionados diretamente no código-fonte. A distribuição de versões compiladas deve ser feita preferencialmente por **GitHub Releases**.

## Privacidade e LGPD

**Não publique neste repositório arquivos reais de produção contendo informações de pacientes.**

Arquivos APOCI, relatórios de consistência, capturas de tela, logs e exemplos podem conter:

- nomes de pacientes;
- CNS e CPF;
- datas de nascimento;
- endereços e telefones;
- informações assistenciais;
- procedimentos;
- números de APAC;
- outros dados pessoais ou dados pessoais sensíveis.

Para exemplos públicos, utilize exclusivamente arquivos fictícios ou completamente anonimizados.

O `.gitignore` do projeto contém bloqueios específicos para `APOCI.*`, `RCONSIST*`, `R0401*` e diretórios reservados a dados privados. Isso é uma camada adicional de proteção e **não substitui a revisão antes de cada commit**.

## Importante

Este projeto é uma **ferramenta independente**.

Não é desenvolvido, mantido, homologado ou distribuído oficialmente pelo DATASUS, Ministério da Saúde, SUS, MV/SoulMV ou qualquer outro fornecedor dos sistemas citados.

APAC, DATASUS, SUS, MV, SoulMV e demais marcas ou sistemas mencionados pertencem aos seus respectivos responsáveis.

O software não substitui regras oficiais de faturamento, validação, produção ambulatorial, layouts ou manuais publicados pelos órgãos responsáveis.

Antes de utilizar arquivos gerados em ambiente produtivo, valide-os no processo oficial correspondente.

## Segurança

Consulte [`SECURITY.md`](SECURITY.md) antes de relatar vulnerabilidades ou compartilhar arquivos de teste.

Nunca publique dados reais de pacientes em issues ou pull requests.

## Contribuições

Consulte [`CONTRIBUTING.md`](CONTRIBUTING.md). Contribuições são bem-vindas, desde que utilizem apenas dados fictícios/anonimizados e preservem as proteções de integridade do conversor.

## Licença

Distribuído sob a **Apache License 2.0**. Consulte [`LICENSE`](LICENSE) e [`NOTICE`](NOTICE).

## Projeto

Desenvolvido por **Gentill Mob Ops**

https://www.gentillops.com.br
