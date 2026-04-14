
import { mapColumnToStatus } from './src/lib/helper.ts';

console.log('Testing mapColumnToStatus...');
console.log('Todo ->', mapColumnToStatus('Todo'));
console.log('In Progress ->', mapColumnToStatus('In Progress'));
console.log('Done ->', mapColumnToStatus('Done'));
console.log('Code Review ->', mapColumnToStatus('Code Review'));
console.log('Backlog ->', mapColumnToStatus('Backlog'));
console.log('Random ->', mapColumnToStatus('Random'));
