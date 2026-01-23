#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PerformanceTestRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      benchmarks: {}
    };
  }

  async runTests() {
    console.log('🚀 Starting Performance Tests for Farmers Boot\n');

    try {
      // Check if backend is running
      await this.checkBackendHealth();

      // Setup test data
      await this.setupTestData();

      // Run Artillery tests
      await this.runArtilleryTests();

      // Generate report
      this.generateReport();

      console.log('\n✅ Performance tests completed successfully');
      console.log(`📊 Results saved to: performance-results-${this.results.timestamp.split('T')[0]}.json`);

    } catch (error) {
      console.error('❌ Performance tests failed:', error.message);
      process.exit(1);
    }
  }

  async checkBackendHealth() {
    console.log('🔍 Checking backend health...');

    try {
      const healthUrl = process.env.TEST_BASE_URL || 'http://localhost:8787';
      const response = await fetch(`${healthUrl}/api/health`);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      console.log('✅ Backend is healthy');
    } catch (error) {
      throw new Error(`Cannot connect to backend: ${error.message}`);
    }
  }

  async setupTestData() {
    console.log('📝 Setting up performance test data...');

    // Create performance test user if it doesn't exist
    const testUser = {
      email: 'performance-test@example.com',
      password: 'TestPass123!',
      name: 'Performance Test User'
    };

    try {
      const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8787';

      // Try to register user (ignore if already exists)
      await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });

      // Login to get token
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });

      if (!loginResponse.ok) {
        throw new Error('Failed to login performance test user');
      }

      const loginData = await loginResponse.json();
      const token = loginData.token || loginData.accessToken;

      // Create test farm
      const farmResponse = await fetch(`${baseUrl}/api/farms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Performance Test Farm',
          location: 'Test Location',
          area_hectares: 100
        })
      });

      if (farmResponse.ok) {
        console.log('✅ Performance test data setup complete');
      }
    } catch (error) {
      console.warn('⚠️  Performance test data setup may have issues:', error.message);
    }
  }

  async runArtilleryTests() {
    console.log('🎯 Running Artillery load tests...');

    const artilleryConfig = path.join(__dirname, '..', 'performance-tests.yml');

    if (!fs.existsSync(artilleryConfig)) {
      throw new Error('Performance test configuration not found');
    }

    try {
      // Run Artillery with JSON output
      const outputFile = `performance-results-${Date.now()}.json`;
      const command = `npx artillery run ${artilleryConfig} --output ${outputFile}`;

      console.log('Executing:', command);
      execSync(command, { stdio: 'inherit', cwd: process.cwd() });

      // Read and parse results
      if (fs.existsSync(outputFile)) {
        const results = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        this.analyzeResults(results);
      }

    } catch (error) {
      throw new Error(`Artillery test execution failed: ${error.message}`);
    }
  }

  analyzeResults(artilleryResults) {
    console.log('📊 Analyzing performance results...');

    const aggregate = artilleryResults.aggregate;

    this.results.benchmarks = {
      total_requests: aggregate.requestsCompleted,
      total_errors: aggregate.errors ? aggregate.errors.total : 0,
      response_times: {
        min: aggregate.latency.min,
        max: aggregate.latency.max,
        median: aggregate.latency.median,
        p95: aggregate.latency.p95,
        p99: aggregate.latency.p99
      },
      throughput: {
        rps_mean: aggregate.rps.mean,
        rps_count: aggregate.rps.count
      },
      scenarios: artilleryResults.aggregate.scenariosCreated
    };

    // Performance benchmarks
    const benchmarks = {
      response_time_p95: {
        value: aggregate.latency.p95,
        threshold: 1000, // 1 second
        status: aggregate.latency.p95 <= 1000 ? 'PASS' : 'FAIL'
      },
      error_rate: {
        value: aggregate.errors ? (aggregate.errors.total / aggregate.requestsCompleted) * 100 : 0,
        threshold: 5, // 5% max error rate
        status: (aggregate.errors ? (aggregate.errors.total / aggregate.requestsCompleted) * 100 : 0) <= 5 ? 'PASS' : 'FAIL'
      },
      throughput_rps: {
        value: aggregate.rps.mean,
        threshold: 10, // Minimum 10 RPS
        status: aggregate.rps.mean >= 10 ? 'PASS' : 'FAIL'
      }
    };

    this.results.benchmarks.thresholds = benchmarks;

    console.log('\n📈 Performance Benchmarks:');
    console.log(`   Response Time (P95): ${aggregate.latency.p95}ms [${benchmarks.response_time_p95.status}]`);
    console.log(`   Error Rate: ${(aggregate.errors ? (aggregate.errors.total / aggregate.requestsCompleted) * 100 : 0).toFixed(2)}% [${benchmarks.error_rate.status}]`);
    console.log(`   Throughput: ${aggregate.rps.mean.toFixed(2)} RPS [${benchmarks.throughput_rps.status}]`);
  }

  generateReport() {
    const reportFile = `performance-report-${this.results.timestamp.split('T')[0]}.json`;
    const reportPath = path.join(process.cwd(), reportFile);

    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // Generate summary
    const summary = {
      test_date: this.results.timestamp,
      environment: this.results.environment,
      overall_status: this.checkOverallStatus(),
      key_metrics: {
        total_requests: this.results.benchmarks.total_requests,
        error_rate_percent: this.results.benchmarks.thresholds?.error_rate?.value || 0,
        avg_response_time_ms: this.results.benchmarks.response_times?.median || 0,
        throughput_rps: this.results.benchmarks.throughput?.rps_mean || 0
      },
      recommendations: this.generateRecommendations()
    };

    const summaryFile = `performance-summary-${this.results.timestamp.split('T')[0]}.json`;
    const summaryPath = path.join(process.cwd(), summaryFile);

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log(`📋 Summary saved to: ${summaryFile}`);
  }

  checkOverallStatus() {
    const thresholds = this.results.benchmarks.thresholds;
    if (!thresholds) return 'UNKNOWN';

    const allPass = Object.values(thresholds).every(t => t.status === 'PASS');
    return allPass ? 'PASS' : 'FAIL';
  }

  generateRecommendations() {
    const recommendations = [];
    const benchmarks = this.results.benchmarks;

    if (benchmarks.thresholds?.response_time_p95?.status === 'FAIL') {
      recommendations.push('Consider optimizing database queries and adding caching layers');
    }

    if (benchmarks.thresholds?.error_rate?.status === 'FAIL') {
      recommendations.push('Investigate error patterns and improve error handling');
    }

    if (benchmarks.thresholds?.throughput_rps?.status === 'FAIL') {
      recommendations.push('Consider horizontal scaling and load balancing');
    }

    if (benchmarks.response_times?.p99 > 2000) {
      recommendations.push('High P99 latency detected - optimize for worst-case performance');
    }

    return recommendations.length > 0 ? recommendations : ['Performance meets all benchmarks - consider monitoring for regressions'];
  }
}

// Run the performance tests
if (require.main === module) {
  const runner = new PerformanceTestRunner();
  runner.runTests().catch(error => {
    console.error('Performance test runner failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceTestRunner;