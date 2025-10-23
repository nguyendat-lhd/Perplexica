# 🧪 Testing Documentation

Tài liệu về testing và quality assurance cho Perplexica.

## 📑 Nội dung

### Test Documentation
- **[TEST_TIMEOUT_INSTRUCTIONS.md](./TEST_TIMEOUT_INSTRUCTIONS.md)** - Hướng dẫn test và xử lý timeout

## 🚀 Running Tests

### Unit Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- test-file.spec.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Manual Testing Scripts
Các test scripts trong thư mục root:
- `test-api.js` - Test API endpoints
- `test-llm-connection.js` - Test LLM connections
- `test-search-handlers.js` - Test search handlers
- `test-beaverx-*.js` - Test BeaverX integration
- `test-ai-agent-handlers.js` - Test AI agent handlers

```bash
# Run manual tests
node test-api.js
node test-llm-connection.js
node test-search-handlers.js
```

## 📊 Test Coverage

### Coverage Goals
- **Overall**: >80%
- **Critical paths**: >90%
- **API endpoints**: 100%
- **Utilities**: >85%

### Generate Coverage Report
```bash
npm run test:coverage

# Open HTML report
open coverage/index.html
```

## 🔧 Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Test Timeout Configuration
Xem chi tiết tại [TEST_TIMEOUT_INSTRUCTIONS.md](./TEST_TIMEOUT_INSTRUCTIONS.md)

## 🧪 Writing Tests

### Test Structure
```javascript
describe('Feature Name', () => {
  beforeAll(() => {
    // Setup
  });

  afterAll(() => {
    // Cleanup
  });

  it('should do something', async () => {
    // Arrange
    const input = 'test';

    // Act
    const result = await someFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Mocking
```javascript
// Mock external API
jest.mock('./api', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'mocked' })
}));

// Mock environment variables
process.env.API_KEY = 'test-key';
```

### Async Testing
```javascript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

// Or using done callback
it('should handle callbacks', (done) => {
  callbackFunction((err, result) => {
    expect(err).toBeNull();
    expect(result).toBeDefined();
    done();
  });
});
```

## 🔍 Testing Different Components

### API Testing
```javascript
const request = require('supertest');
const app = require('./app');

describe('POST /api/search', () => {
  it('should return search results', async () => {
    const response = await request(app)
      .post('/api/search')
      .send({ query: 'test' })
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });
});
```

### LLM Testing
```javascript
describe('LLM Integration', () => {
  it('should connect to LLM provider', async () => {
    const llm = new LLMProvider({
      apiKey: process.env.API_KEY
    });

    const response = await llm.generate('test prompt');
    expect(response).toBeDefined();
  });
});
```

### Search Handler Testing
```javascript
describe('Search Handler', () => {
  it('should process search query', async () => {
    const handler = new SearchHandler();
    const result = await handler.search('test query');

    expect(result).toHaveProperty('sources');
    expect(result.sources).toBeInstanceOf(Array);
  });
});
```

## 🚨 Common Testing Issues

### Timeout Issues
**Problem**: Tests timeout after 5 seconds (Jest default)  
**Solution**: Increase timeout for specific tests

```javascript
it('should handle long operations', async () => {
  // Custom timeout: 30 seconds
}, 30000);

// Or globally
jest.setTimeout(30000);
```

Xem thêm tại [TEST_TIMEOUT_INSTRUCTIONS.md](./TEST_TIMEOUT_INSTRUCTIONS.md)

### Flaky Tests
**Problem**: Tests pass/fail intermittently  
**Solutions**:
- Remove time-dependent logic
- Use deterministic test data
- Properly cleanup after tests
- Avoid relying on external services

### Memory Leaks
**Problem**: Tests consume too much memory  
**Solutions**:
```javascript
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

afterAll(async () => {
  // Close connections
  await database.close();
  await server.close();
});
```

## 📈 Test Performance

### Optimize Test Speed
```javascript
// Run tests in parallel (default)
npm test -- --maxWorkers=4

// Run sequentially for debugging
npm test -- --runInBand

// Only run changed tests
npm test -- --onlyChanged
```

### Test Profiling
```javascript
// Profile slow tests
npm test -- --verbose

// Show test duration
npm test -- --testTimeout=10000 --verbose
```

## 🔐 Testing Best Practices

### 1. Arrange-Act-Assert Pattern
```javascript
it('should calculate total correctly', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(30);
});
```

### 2. Test One Thing
```javascript
// Good
it('should add item to cart', () => {
  cart.addItem(item);
  expect(cart.items).toContain(item);
});

it('should update cart total', () => {
  cart.addItem(item);
  expect(cart.total).toBe(item.price);
});

// Bad - testing multiple things
it('should add item and update total', () => {
  cart.addItem(item);
  expect(cart.items).toContain(item);
  expect(cart.total).toBe(item.price);
});
```

### 3. Use Descriptive Names
```javascript
// Good
it('should return 404 when user not found', () => {});

// Bad
it('test user', () => {});
```

### 4. Don't Test Implementation Details
```javascript
// Good - test behavior
it('should display user name', () => {
  render(<UserProfile user={user} />);
  expect(screen.getByText(user.name)).toBeInTheDocument();
});

// Bad - test implementation
it('should call getUserName function', () => {
  const spy = jest.spyOn(UserProfile, 'getUserName');
  render(<UserProfile user={user} />);
  expect(spy).toHaveBeenCalled();
});
```

## 📚 Related Documentation

- [CI/CD Testing](../ci-cd/CI_TEST.md) - Testing trong CI pipeline
- [Troubleshooting](../troubleshooting/) - Debug test failures
- [Architecture](../architecture/) - Hiểu system để test tốt hơn

## 💡 Tips

- **Write tests first** (TDD) when possible
- **Keep tests simple** and readable
- **Mock external dependencies** để tests chạy nhanh
- **Test edge cases** và error scenarios
- **Maintain test coverage** >80%
- **Review test failures** carefully
- **Update tests** when code changes

## 🎯 Next Steps

1. Review [TEST_TIMEOUT_INSTRUCTIONS.md](./TEST_TIMEOUT_INSTRUCTIONS.md)
2. Run existing tests: `npm test`
3. Check coverage: `npm run test:coverage`
4. Write tests for new features
5. Set up CI testing pipeline

[← Quay lại Docs chính](../README.md)



