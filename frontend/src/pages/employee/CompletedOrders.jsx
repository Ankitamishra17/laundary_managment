import MyTasks from "./MyTasks";

// Reuses the task list but opens on the "completed" filter.
export default function CompletedOrders() {
  return <MyTasks initialStatus="completed" />;
}
