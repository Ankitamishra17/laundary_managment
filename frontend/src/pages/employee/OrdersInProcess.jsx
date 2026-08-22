import MyTasks from "./MyTasks";

// Reuses the task list but opens on the "in progress" filter.
export default function OrdersInProcess() {
  return <MyTasks initialStatus="in_progress" />;
}
