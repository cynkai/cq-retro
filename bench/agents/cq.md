# Navigating this repository

This repository is large (75 Python modules, ~54K lines; several files exceed 5K lines).
`cq` is installed for locating and reading code without opening whole files:

```bash
# 1. List classes/methods/functions with line numbers. Scope it to a directory —
#    the whole package index is ~80KB.
node {{CQ}} index sqlglot/dialects --level=L0

# 2. Print exactly one declaration (file path is relative to the repo root).
node {{CQ}} inspect . sqlglot/dialects/postgres.py Generator.datatype_sql
node {{CQ}} inspect . sqlglot/expressions.py Anonymous
node {{CQ}} inspect . sqlglot/parser.py line:1200
```

**Required:** read Python source with `cq inspect`, not `sed`, `cat`, `head` or `nl`. Use
`cq index` to see what a module contains. `rg` is fine for finding which file mentions a name,
but read the matching declaration with `cq inspect`. Nested classes are addressed by their inner name (`Generator.method`, not
`TSQL.Generator.method`). Top-level functions are addressed by bare name.
