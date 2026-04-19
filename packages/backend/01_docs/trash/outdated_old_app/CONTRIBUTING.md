# Contributing — residence-backend-v2

Guidelines for contributors

Coding conventions
- Follow existing code style (CommonJS `require`/`module.exports`, Sequelize models).
- Keep controllers focused; move business logic into services in `services/` when complex.
- Add unit tests for any new logic.

Branches and PRs
- Create feature branches from `main` named `feature/<short-description>`.
- Open PRs against `main` with a clear description and testing steps.

Testing
- Add tests in a `test/` folder. Use Jest or Mocha + Chai. Include happy-path and key edge cases.

Commits
- Use clear, imperative commit messages (e.g., "Add password hashing hook to User model").

Security
- Never commit secrets. Use `.env` and `.env.example` for documentation.

Contact
- For architecture or product questions, contact project owner (see repo metadata).
