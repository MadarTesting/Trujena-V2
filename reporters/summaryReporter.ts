import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

// prints a clear report in the terminal at the end of the run:
// how many tests PASSED / FAILED / SKIPPED + the names, and where the screenshot / video of every failed test is
// بيطبع ملخص PASSED / FAILED / SKIPPED في آخر الـ run
class SummaryReporter implements Reporter {
    passed: string[] = [];
    failed: { name: string; error: string; types: string[]; files: string[] }[] = [];
    skipped: string[] = [];

    // بعد كل تست: بيحطه في القايمة الصح
    onTestEnd(test: TestCase, result: TestResult) {
        if (result.retry < test.retries) return;    // wait for the last try

        const name = `${test.location.file.split(/[\\/]/).pop()} › ${test.title}`;
        if (result.status === 'skipped') {
            this.skipped.push(name);
        } else if (test.outcome() === 'expected' || test.outcome() === 'flaky') {
            this.passed.push(name);
        } else {
            const error = (result.error?.message ?? '').split('\n')[0].replace(/\u001b\[\d+m/g, '');
            const files = result.attachments.filter(a => a.path).map(a => `${a.name}: ${a.path}`);
            // Frontend ولا Backend (اتحطت في التقرير من fixtures/closeWindow)
            const types = (result.annotations ?? []).filter(a => a.type.startsWith('Failure type')).map(a => a.description ?? '');
            this.failed.push({ name, error, types, files });
        }
    }

    // في الآخر: بيطبع الملخص
    onEnd() {
        const line = '='.repeat(70);
        console.log(`\n${line}\n                           TEST REPORT\n${line}`);
        console.log(`  PASSED : ${this.passed.length}`);
        console.log(`  FAILED : ${this.failed.length}`);
        console.log(`  SKIPPED: ${this.skipped.length}`);
        console.log(`  TOTAL  : ${this.passed.length + this.failed.length + this.skipped.length}`);

        if (this.passed.length) {
            console.log(`\n---------- PASSED (${this.passed.length}) ----------`);
            this.passed.forEach(name => console.log(`  ✅ ${name}`));
        }
        if (this.failed.length) {
            console.log(`\n---------- FAILED (${this.failed.length}) ----------`);
            this.failed.forEach(t => {
                console.log(`  ❌ ${t.name}`);
                console.log(`       error: ${t.error}`);
                t.types.forEach(type => console.log(`       type : ${type}`));
                t.files.forEach(file => console.log(`       ${file}`));
            });
        }
        if (this.skipped.length) {
            console.log(`\n---------- SKIPPED (${this.skipped.length}) ----------`);
            this.skipped.forEach(name => console.log(`  ⏸️ ${name}`));
        }
        console.log(`\n  full report (screenshots + videos): npx playwright show-report\n${line}\n`);
    }

    printsToStdio() {
        return false;     // so the "list" reporter still prints the tests while they run
    }
}

export default SummaryReporter;
