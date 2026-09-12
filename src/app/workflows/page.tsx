import { redirect } from 'next/navigation';

export default function WorkflowsPage() {
  redirect('/tasks?type=WORKFLOW_STEP');
}
