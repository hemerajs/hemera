# CONTRIBUTING

Contributions are always welcome, no matter how large or small. Before contributing,
please read the [code of conduct](CODE_OF_CONDUCT.md).

## Setup

1. Install gnats on your system: http://nats.io/download/
2. Fork the repo: https://github.com/hemerajs/hemera
3. Run the following commands:

```sh
$ git clone YOUR_HEMERA_REPO_URL
$ npm run setup
```

## Testing

Hemera unit tests
```sh
$ npm run test
```

Package specific vendor tests
```sh
$ lerna run test
```

## Pull Requests

We actively welcome your pull requests.

1. Fork the repo and create your branch from `master`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints and is correctly formatted. ([Prettier](https://github.com/prettier/prettier))

## License

By contributing to HemeraJs, you agree that your contributions will be licensed
under its [MIT license](LICENSE).
