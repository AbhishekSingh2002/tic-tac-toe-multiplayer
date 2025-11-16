# Contributing to Tic-Tac-Toe Multiplayer

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Keep discussions professional

## Getting Started

### Prerequisites
- Git
- Docker & Docker Compose
- Node.js 18+
- Expo CLI
- Basic knowledge of React Native and Lua

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/your-username/tic-tac-toe-multiplayer.git
cd tic-tac-toe-multiplayer
```

3. Set up environment:
```bash
cp .env.example .env
docker-compose up -d
```

4. Install mobile dependencies:
```bash
cd mobile
npm install
```

## Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Making Changes

1. Write code following our style guidelines
2. Add tests for new functionality
3. Update documentation as needed
4. Ensure all tests pass
5. Commit with clear messages

### Commit Messages

Follow the conventional commits format:

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build/tooling changes

**Examples:**
```
feat(matchmaking): add skill-based pairing

Implement ELO-based matchmaking to pair players
of similar skill levels.

Closes #123
```

```
fix(game): prevent moves on occupied cells

Add validation to reject moves on non-empty cells
and return proper error message.

Fixes #456
```

## Code Style Guidelines

### JavaScript/React Native

- Use ES6+ syntax
- Prefer functional components with hooks
- Use arrow functions for callbacks
- Follow Airbnb React style guide
- Max line length: 100 characters
- Use meaningful variable names

**Example:**
```javascript
// Good
const handleCellPress = async (cellIndex) => {
  if (!isMyTurn) return;
  
  try {
    await makeMove(matchId, cellIndex);
  } catch (error) {
    console.error('Move failed:', error);
  }
};

// Bad
function h(i) {
  if (!t) return;
  makeMove(m, i).catch(e => console.log(e));
}
```

### Lua

- Use snake_case for variables and functions
- Use PascalCase for module names
- Comment complex logic
- Follow Lua style guide

**Example:**
```lua
-- Good
local function validate_move(state, player_id, cell_index)
  if state.status ~= "active" then
    return false, "Game is not active"
  end
  
  return true
end

-- Bad
local function v(s,p,c)
  if s.status~="active" then return false end
  return true
end
```

## Testing

### Running Tests

**Server (Lua):**
```bash
cd server
lua tests/unit/test_game_logic.lua
```

**Mobile (JavaScript):**
```bash
cd mobile
npm test
```

### Writing Tests

- Write unit tests for all new functions
- Include edge cases and error scenarios
- Use descriptive test names
- Aim for 80%+ code coverage

**Example:**
```javascript
describe('makeMove', () => {
  it('should reject moves on occupied cells', async () => {
    const state = { board: ['X', '', ''] };
    
    await expect(makeMove(state, 0))
      .rejects
      .toThrow('Cell already occupied');
  });
});
```

## Documentation

### Code Comments

- Comment complex algorithms
- Explain "why", not "what"
- Keep comments up to date

### README Updates

Update README.md if you:
- Add new features
- Change setup instructions
- Modify configuration
- Update dependencies

### API Documentation

Update `docs/api_spec.md` for:
- New RPC endpoints
- Changed request/response formats
- New WebSocket messages

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with develop

### Submitting a PR

1. Push your branch to your fork
2. Create a Pull Request to `develop` branch
3. Fill out the PR template
4. Link related issues
5. Request review from maintainers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots
If applicable, add screenshots

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Code follows style guide
```

### Review Process

- Maintainers will review within 3-5 days
- Address feedback promptly
- Be open to suggestions
- Keep discussions constructive

### After Approval

- Maintainer will merge your PR
- Delete your feature branch
- Pull latest develop branch

## Reporting Bugs

### Before Reporting

- Check existing issues
- Verify it's reproducible
- Collect relevant information

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the issue

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., iOS 17]
- App version: [e.g., 1.0.0]
- Device: [e.g., iPhone 14]

**Additional context**
Any other relevant information
```

## Feature Requests

### Template

```markdown
**Is your feature request related to a problem?**
Describe the problem

**Describe the solution you'd like**
Clear description of desired feature

**Describe alternatives you've considered**
Other approaches considered

**Additional context**
Mockups, examples, etc.
```

## Code Review Guidelines

### As a Reviewer

- Be kind and constructive
- Explain reasoning for changes
- Approve or request changes promptly
- Test the changes locally

### As an Author

- Respond to feedback professionally
- Ask questions if unclear
- Make requested changes
- Thank reviewers for their time

## Release Process

1. Create release branch from develop
2. Update version numbers
3. Update CHANGELOG.md
4. Create release PR to main
5. After approval, merge and tag
6. Deploy to production
7. Merge main back to develop

## Getting Help

- **Discord**: [Community Server]
- **Issues**: GitHub Issues
- **Email**: support@example.com

## Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Project website (if applicable)

Thank you for contributing! 🎉
