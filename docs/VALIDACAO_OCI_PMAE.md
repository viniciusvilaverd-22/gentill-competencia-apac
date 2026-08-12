# Validação OCI/PMAE — competência x encerramento

Este documento registra a regra de segurança implementada no **Gentill Competência APAC v2.4.0**.

> O projeto é independente e não representa homologação oficial do DATASUS, Ministério da Saúde, SUS ou MV/SoulMV.

## Problema observado

Em ambiente de teste com APAC Magnético 3.12c foi reproduzida a crítica:

```text
010082 — DATA DE ENCERRAMENTO DIFERENTE DA COMPETENCIA
```

O cenário analisado possuía uma fatura referente a um mês e uma remessa OCI configurada com competência de apresentação referente ao mês anterior.

A análise do banco SoulMV mostrou que esses conceitos podem coexistir separadamente:

- período/descrição da fatura;
- competência de apresentação da remessa;
- data inicial da APAC;
- data final de validade;
- data de ocorrência/encerramento.

Por isso a competência correta de apresentação não deve ser inferida apenas pelo mês da fatura.

## Regra implementada

A aplicação lê as datas de encerramento existentes nos registros `14` do arquivo APOCI.

### Um único mês de encerramento

Se todas as datas válidas de encerramento pertencerem ao mesmo mês, esse mês é apresentado como **competência recomendada**.

Exemplo fictício:

```text
Competência gravada:       07/2026
Encerramentos:             06/2026
Competência recomendada:   06/2026
```

Nesse cenário:

- `06/2026` pode ser selecionado como destino;
- `07/2026` é bloqueado;
- nenhuma data assistencial é modificada.

### Arquivo já consistente

Se a competência gravada já corresponder ao mês de todos os encerramentos, a aplicação informa que o arquivo está consistente e não propõe conversão desnecessária.

### Competências distintas no mesmo arquivo

Se forem encontradas APACs encerradas em meses diferentes, a conversão automática para uma única competência é bloqueada.

Exemplo fictício:

```text
06/2026: 6 APACs
07/2026: 3 APACs
```

O arquivo deve ser revisado e, quando aplicável, separado no sistema de origem antes da apresentação.

### Encerramento não identificado

Quando não existe uma data de encerramento válida nos registros analisados, a ferramenta não inventa uma competência. A operação permanece disponível apenas com aviso e deve ser validada pelo operador no fluxo oficial.

## Campos que não são alterados

A v2.4.0 não reescreve automaticamente:

- data inicial;
- data final de validade;
- data de ocorrência/encerramento;
- data de solicitação;
- data de autorização;
- número da APAC;
- dados do paciente;
- CNS/CNES;
- CID;
- procedimentos;
- quantidades;
- profissionais;
- demais campos assistenciais ou administrativos.

A conversão permanece restrita aos campos estruturais de competência previamente mapeados no layout tratado pela aplicação.

## APAC Magnético 3.12c

A divergência de encerramento x competência foi reproduzida em teste com o APAC Magnético 3.12c. Por esse motivo, a aplicação trata destino incompatível como bloqueio e identifica o risco de crítica `010082`.

## APAC Magnético 4.00

No perfil 4.00, a mesma checagem é aplicada como **pré-validação preventiva**. O projeto não declara que todas as validações internas das versões 3.12c e 4.00 sejam idênticas.

## SoulMV

A investigação do ambiente de teste identificou uso de uma competência de apresentação específica na remessa APAC, distinta do período da fatura.

O Gentill Competência APAC **não acessa o banco SoulMV**, não executa `UPDATE`, `INSERT` ou `DELETE` e não altera cadastros. A lógica da v2.4.0 trabalha exclusivamente sobre o arquivo APOCI selecionado pelo operador.

## Integridade

Antes de liberar a saída, o conversor verifica:

1. estrutura dos registros homologados;
2. consistência da competência de destino com os encerramentos identificados;
3. tamanho do arquivo;
4. bytes modificados fora dos campos autorizados;
5. equivalência dos dados após normalização dos campos de competência;
6. SHA-256 do arquivo de origem e do resultado.

O relatório de auditoria registra explicitamente **0 datas assistenciais alteradas**.
