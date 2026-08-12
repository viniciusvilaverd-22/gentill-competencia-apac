# Gentill Competência APAC

Utilitário desktop para Windows desenvolvido para auxiliar na **validação e alteração controlada da competência de arquivos APOCI utilizados no fluxo do APAC Magnético**.

O sistema trabalha diretamente sobre a estrutura do arquivo, identificando os campos de competência conhecidos e aplicando somente as alterações necessárias, preservando os demais dados.

## Principais recursos

* Seleção do arquivo APOCI.
* Detecção automática da competência atual.
* Escolha da nova competência por mês e ano.
* Geração automática do arquivo com extensão correspondente, como:

  * `APOCI.JUN`
  * `APOCI.JUL`
  * `APOCI.AGO`
* Perfil de compatibilidade selecionável:

  * **APAC Magnético 3.12c**
  * **APAC Magnético 4.00**
* Validação estrutural antes da conversão.
* Tratamento controlado dos registros atualmente homologados:

  * `01`
  * `14`
  * `06`
  * `13`
* Bloqueio automático quando são encontrados registros ou estruturas ainda não reconhecidos.
* Preservação dos dados assistenciais e administrativos que não pertencem ao campo de competência.
* Não realiza substituição global de datas ou números.
* Geração de relatório de auditoria.
* Verificação de integridade por SHA-256.
* Operação local e offline.
* Executável portátil para Windows x64.

## Segurança da conversão

O sistema foi projetado para evitar alterações indiscriminadas no arquivo.

A conversão atua somente nos campos previamente mapeados como competência. Informações como paciente, número da APAC, procedimentos, CNS, CNES, CID, quantidades, profissionais e demais dados não são modificadas automaticamente.

O arquivo original deve ser sempre preservado, sendo gerada uma nova versão para validação e importação.

## Compatibilidade

Atualmente existem dois perfis disponíveis:

### APAC Magnético 3.12c

Perfil destinado a ambientes legados que ainda utilizam a versão 3.12c do APAC Magnético.

Inclui verificações adicionais para situações conhecidas de inconsistência entre competência e datas relacionadas à APAC.

### APAC Magnético 4.00

Perfil destinado ao layout mais recente utilizado pelo APAC Magnético 4.00.

O sistema verifica também a identificação da versão existente no cabeçalho do arquivo.

## Fluxo básico

1. Abra o Gentill Competência APAC.
2. Selecione a versão do APAC Magnético utilizada.
3. Escolha o arquivo APOCI.
4. Confira a competência detectada.
5. Selecione a nova competência.
6. Revise as validações apresentadas.
7. Gere o novo arquivo.
8. Confira o relatório de auditoria.
9. Valide o resultado no ambiente APAC Magnético antes de qualquer utilização definitiva.

## Importante

Este projeto é uma **ferramenta independente**.

Não é desenvolvido, mantido, homologado ou distribuído oficialmente pelo DATASUS, Ministério da Saúde, SUS, MV ou qualquer outro fornecedor dos sistemas citados.

APAC, DATASUS, SUS, SoulMV/MV e demais marcas ou sistemas mencionados pertencem aos seus respectivos responsáveis.

O software não substitui as regras oficiais de faturamento, validação, produção ambulatorial ou os layouts publicados pelos órgãos responsáveis.

Antes de utilizar arquivos gerados em ambiente produtivo, valide-os no processo oficial correspondente.

## Privacidade e LGPD

**Não publique no repositório arquivos reais de produção contendo informações de pacientes.**

Arquivos APOCI, relatórios de consistência, capturas de tela, logs e exemplos podem conter:

* nomes de pacientes;
* CNS;
* CPF;
* datas de nascimento;
* endereços;
* telefones;
* informações assistenciais;
* procedimentos;
* números de APAC;
* outros dados pessoais ou dados pessoais sensíveis.

Para exemplos públicos, utilize exclusivamente arquivos fictícios ou completamente anonimizados.

## Projeto

Desenvolvido por **Gentill Mob Ops**

[www.gentillops.com.br](http://www.gentillops.com.br)
