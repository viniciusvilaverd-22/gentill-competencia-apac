# Contribuindo com o Gentill Competência APAC

Obrigado pelo interesse em contribuir.

## Regra mais importante

**Nunca envie dados reais de pacientes ou arquivos de produção.**

Pull requests, issues, testes e exemplos devem utilizar exclusivamente dados fictícios ou completamente anonimizados.

Não publique:

- `APOCI.*` reais;
- `RCONSIST*` ou `R0401*` reais;
- nomes, CNS, CPF, endereços ou telefones de pacientes;
- números reais de APAC;
- capturas de tela de sistemas contendo dados identificáveis;
- credenciais, chaves, tokens ou arquivos `.env`.

## Alterações no motor de conversão

Mudanças em `src/app.js` devem preservar os princípios de segurança do projeto:

1. não fazer substituição global de datas, números ou competências;
2. alterar somente posições explicitamente mapeadas e validadas;
3. bloquear estruturas desconhecidas em vez de assumir layouts;
4. preservar o tamanho do arquivo quando a regra exigir conversão posicional;
5. detectar qualquer byte alterado fora dos campos autorizados;
6. manter auditoria das alterações;
7. não alterar automaticamente dados assistenciais apenas para contornar uma crítica de importação.

## Testes

Use somente arquivos sintéticos criados especificamente para testes.

Um pull request que altere regras de parsing ou conversão deve descrever:

- tipo de registro afetado;
- posição/campo alterado;
- motivo da mudança;
- comportamento antes e depois;
- forma utilizada para validar que outros bytes permaneceram intactos.

## Compatibilidade

Os perfis 3.12c e 4.00 devem permanecer separados quando houver regras de validação distintas. Não trate diferenças entre versões como simples mudança visual.

## Documentação

Atualize `CHANGELOG.md` quando a alteração modificar comportamento, compatibilidade, segurança ou formato de saída.

## Licença

Ao contribuir, você concorda que sua contribuição será disponibilizada sob a Apache License 2.0 adotada pelo projeto.
