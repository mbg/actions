# Stack Actions

These Actions simplify the use of `stack` for Haskell projects. Some general features:

- Stack is installed using the `haskell-actions/setup` Action.
- Dependencies will be cached between builds.

## build

Builds a Haskell project with `stack`. Example workflow:

```yaml
name: Haskell

on:
  push:
    branches:
      - main
    paths:
      - ".github/workflows/**"
      - "src/**"
      - "package.yaml"
      - "stack*.yaml"
  pull_request:
    branches:
      - main

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        resolver:
          - stack-lts-20
          - stack-lts-19
          - stack-lts-18

    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: mbg/actions/stack/build@v0.1
        with:
          # the basename of the Stack configuration file
          # e.g. specify "stack" to get "stack.yaml"
          resolver: ${{ matrix.resolver }}
          # Whether to upload Haddock documentation as a build artifact
          upload-docs: true
```

## nightly

Builds a Haskell project with `stack` using the latest, nightly resolver. Example workflow:

```yaml
name: "Stackage Nightly"

on:
  schedule:
    - cron: "5 6 * * *"
  workflow_dispatch:
  pull_request:
  push:
    paths:
      - ".github/workflows/stackage-nightly.yml"

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: mbg/actions/stack/nightly@v0.1
```
