# Gentill Competência APAC

Utilitário desktop/web local para Windows desenvolvido para auxiliar na **validação e alteração controlada da competência de arquivos APOCI utilizados em fluxos do APAC Magnético**.

> **Ferramenta independente — não oficial DATASUS/MV.**

O sistema identifica os campos de competência conhecidos na estrutura do arquivo e aplica somente as alterações autorizadas, preservando os demais dados.

**Versão atual documentada:** `2.3.0`

## Principais recursos

- seleção do arquivo APOCI;
- detecção automática da competência atual;
- escolha da nova competência por mês e ano;
- geração automática do arquivo com extensão correspondente, como `APOCI.JUN`, `APOCI.JUL` ou `APOCI.AGO`;
- perfil de compatibilidade selecionável:
  - **APAC Magnético 3.12c**;
  - **APAC Magnético 4.00**;
- validação estrutural antes da conversão;
- tratamento controlado dos registros atualmente homologados:
  - `01`;
  - `14`;
  - `06`;
  - `13`;
- bloqueio quando são encontrados registros ou estruturas ainda não reconhecidos;
- preservação dos dados que não pertencem aos campos de competência autorizados;
- nenhuma substituição global indiscriminada de datas ou números;
- geração de relatório de auditoria;
- verificação de integridade por SHA-256;
- operação local e offline;
- interface Desktop técnico profissional.

## Código-fonte

A versão pública está organizada em três arquivos simples e auditáveis:

- `src/index.html` — interface e estrutura da aplicação;
- `src/styles.css` — identidade visual Desktop técnico;
- `src/app.js` — validação, conversão, compatibilidade e auditoria.

Para inspecionar a aplicação localmente, clone o repositório e abra `src/index.html` em um navegador compatível.

O repositório **não contém arquivos reais de pacientes** e não deve receber esse tipo de dado em commits, issues ou pull requests.

## Segurança da conversão

O sistema foi projetado para evitar alterações indiscriminadas no arquivo.

A conversão atua somente nos campos previamente mapeados como competência. Informações como paciente, número da APAC, procedimentos, CNS, CNES, CID, quantidades, profissionais e demais dados não são modificadas automaticamente.

O arquivo original deve ser preservado, sendo gerada uma nova versão para validação e importação.

## Compatibilidade

### APAC Magnético 3.12c

Perfil destinado a ambientes legados que ainda utilizam a versão 3.12c do APAC Magnético.

Inclui verificações adicionais para situações conhecidas de inconsistência entre competência e datas relacionadas à APAC. O perfil **não altera automaticamente datas assistenciais para forçar a importação**.

### APAC Magnético 4.00

Perfil destinado ao layout 04.00 analisado pelo projeto.

O sistema verifica também a identificação da versão existente no cabeçalho do arquivo e mantém as alterações restritas aos campos homologados pelo conversor.

## Fluxo básico

1. Abra o Gentill Competência APAC.
2. Selecione a versão do APAC Magnético utilizada.
3. Escolha o arquivo APOCI.
4. Confira a competência detectada.
5. Selecione a nova competência.
6. Revise as validações apresentadas.
7. Gere o novo arquivo.
8. Confira o relatório de auditoria.
9. Valide o resultado no ambiente APAC Magnético correspondente antes de qualquer utilização definitiva.

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
