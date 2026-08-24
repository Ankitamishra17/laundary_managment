/* eslint-disable no-console */
// ================================================================
// END-TO-END TASK LIFECYCLE TEST
// ================================================================
// Tests:
//   1. Admin assigns pickup task to employee
//   2. Duplicate assignment is blocked (same order + same task + same employee)
//   3. Employee starts task, started_at timestamp set
//   4. Employee completes task, completed_at timestamp set
//   5. Admin sees completion in task history
//   6. Employee sees task in their history
//   7. Order status is automatically updated through the lifecycle
//   8. Different employee can be assigned a different task for same order
//   9. Full sequence: pickup then wash then delivery with different employees
// ================================================================

const BASE = "http://localhost:5000/api";

async function api(method, path, token, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log("  OK: " + label);
    passed++;
  } else {
    console.log("  FAIL: " + label);
    failed++;
  }
}

async function main() {
  console.log("\nTASK LIFECYCLE END-TO-END TEST\n");

  // ================================================================
  // SETUP: Super admin creates a shop + admin, then create test data
  // ================================================================
  console.log("-- SETUP --");

  const saLogin = await api("POST", "/auth/login", null, {
    email: "superadmin@gmail.com",
    password: "SuperAdmin123@",
  });
  assert(saLogin.success, "Super admin login successful");
  const saTok = saLogin.token;

  // Create a test shop (super admin creates shops)
  const shopTs = Date.now();
  const shopRes = await api("POST", "/shops", saTok, {
    name: "Lifecycle Test Shop",
    ownerName: "Test Owner",
    email: "lcadmin" + shopTs + "@example.com",
    phone: "70000" + String(shopTs).slice(-5),
    address: "123 Test Street",
    city: "Testville",
    state: "TS",
    country: "India",
    subscriptionPlan: "Monthly",
    subscriptionAmount: 5000,
    planName: "Pro",
  });
  assert(shopRes.success, "Shop created: " + shopRes.message);
  const shopId = shopRes.shop?.id;
  assert(!!shopId, "Shop ID: " + shopId);

  const tempPassword = shopRes.admin?.temporaryPassword;
  const adminEmail = shopRes.admin?.email;
  assert(!!tempPassword, "Temp admin password received");
  assert(!!adminEmail, "Admin email: " + adminEmail);

  // Admin login with temp password
  const adminLogin = await api("POST", "/auth/login", null, {
    email: adminEmail,
    password: tempPassword,
  });
  assert(adminLogin.success, "Admin login with temp password successful");
  let aTok = adminLogin.token;

  // Set new password if mustChangePassword
  if (adminLogin.mustChangePassword) {
    const changePw = await api("PATCH", "/profile/password", aTok, {
      currentPassword: tempPassword,
      newPassword: "TestAdmin@123",
    });
    if (changePw.success) {
      // Re-login with new password
      const reLogin = await api("POST", "/auth/login", null, {
        email: adminEmail,
        password: "TestAdmin@123",
      });
      aTok = reLogin.token;
      assert(reLogin.success, "Admin re-login with new password successful");
    } else {
      console.log("  (password change: " + (changePw.message || "failed") + ", continuing with temp token)");
    }
  }

  // Create two test employees
  const ts = Date.now();
  const emp1Res = await api("POST", "/admin/employees", aTok, {
    name: "Test Emp A",
    email: "testempA" + ts + "@example.com",
    phone: "90000" + String(ts).slice(-5),
    password: "Emp@12345",
    designation: "Pickup Staff",
  });
  assert(emp1Res.success, "Employee A created");
  const empAId = emp1Res.data?.id || emp1Res.employee?.id;
  assert(!!empAId, "Employee A ID: " + empAId);

  const emp2Res = await api("POST", "/admin/employees", aTok, {
    name: "Test Emp B",
    email: "testempB" + ts + "@example.com",
    phone: "91000" + String(ts).slice(-5),
    password: "Emp@12345",
    designation: "Wash Staff",
  });
  assert(emp2Res.success, "Employee B created");
  const empBId = emp2Res.data?.id || emp2Res.employee?.id;
  assert(!!empBId, "Employee B ID: " + empBId);

  // Create a test customer
  const custRes = await api("POST", "/auth/register", null, {
    name: "Lifecycle Test Customer",
    email: "lcust" + ts + "@example.com",
    phone: "80000" + String(ts).slice(-5),
    password: "Test@12345",
    shopId: shopId,
  });
  assert(custRes.success, "Customer registered");
  const cTok = custRes.token;

  // Seed a service for the shop if none exist
  const svcRes = await api("GET", "/shops/public/" + shopId + "/services");
  let svcId = svcRes.data?.[0]?.id;
  if (!svcId) {
    const newSvc = await api("POST", "/services", aTok, {
      shopId: shopId, serviceName: "Test Wash", category: "Washing",
      price: 100, pricingType: "Per Kg", estimatedTime: "24 hours",
    });
    svcId = newSvc.data?.id;
  }
  assert(!!svcId, "Got service ID: " + svcId);

  // Create an order
  const orderRes = await api("POST", "/orders", cTok, {
    shopId: shopId,
    pickupDate: "2026-08-22",
    pickupTime: "10:00 - 12:00",
    pickupAddress: "123 Test Street",
    deliveryAddress: "456 Delivery Avenue",
    items: [{ serviceId: svcId, quantity: 2 }],
  });
  assert(orderRes.success, "Order created");
  const orderId = orderRes.data?.id;
  assert(!!orderId, "Order ID: " + orderId);

  // ================================================================
  // TEST 1: Admin assigns pickup task to Employee A
  // ================================================================
  console.log("\n-- TEST 1: Assign Pickup Task --");

  const pickupTask = await api("POST", "/tasks", aTok, {
    order_id: orderId,
    employee_id: empAId,
    task_type: "pickup",
    scheduled_time: "2026-08-22T10:00",
    priority: "normal",
    notes: "Pickup from customer home",
  });
  assert(pickupTask.success, "Pickup task assigned successfully");
  const pickupTaskId = pickupTask.data?.id;
  assert(!!pickupTaskId, "Pickup task ID: " + pickupTaskId);
  assert(pickupTask.data?.status === "pending", "Initial status is pending: " + pickupTask.data?.status);
  assert(!pickupTask.data?.started_at, "started_at is null before starting");
  assert(!pickupTask.data?.completed_at, "completed_at is null before completing");

  // ================================================================
  // TEST 2: Duplicate assignment is blocked
  // ================================================================
  console.log("\n-- TEST 2: Duplicate Assignment Blocked --");

  const dupTask = await api("POST", "/tasks", aTok, {
    order_id: orderId,
    employee_id: empAId,
    task_type: "pickup",
    scheduled_time: "2026-08-22T11:00",
    priority: "urgent",
  });
  assert(!dupTask.success, "Duplicate assignment is BLOCKED");
  assert(
    dupTask.message && dupTask.message.toLowerCase().indexOf("already assigned") !== -1,
    "Error message mentions already assigned: " + dupTask.message
  );

  // NOTE: Assigning the same task type to a different employee IS allowed by
  // the business rules, but it creates a pending pickup task for Employee B
  // that would block the sequence validation later.  We skip this to keep the
  // test flow clean. The core duplicate-per-employee guard is tested above.

  // Different task type to same employee IS allowed
  const washTask = await api("POST", "/tasks", aTok, {
    order_id: orderId,
    employee_id: empAId,
    task_type: "wash",
    scheduled_time: "2026-08-22T11:00",
    priority: "normal",
  });
  assert(washTask.success, "Different task type to same employee IS allowed");
  const washTaskId = washTask.data?.id;
  assert(!!washTaskId, "Wash task ID: " + washTaskId);

  // ================================================================
  // TEST 3: Employee A logs in and sees tasks
  // ================================================================
  console.log("\n-- TEST 3: Employee Login & View Tasks --");

  const empLogin = await api("POST", "/auth/login", null, {
    email: "testempA" + ts + "@example.com",
    password: "Emp@12345",
  });
  assert(empLogin.success, "Employee A login successful");
  const eTok = empLogin.token;

  const myTasks = await api("GET", "/tasks/my-tasks", eTok);
  assert(myTasks.success, "Employee can fetch their tasks");
  assert(Array.isArray(myTasks.data), "Tasks is an array");
  const empPickupTask = myTasks.data?.find(function(t) { return t.id === pickupTaskId; });
  assert(!!empPickupTask, "Employee sees the pickup task assigned to them");
  const empWashTask = myTasks.data?.find(function(t) { return t.id === washTaskId; });
  assert(!!empWashTask, "Employee sees the wash task assigned to them");

  // ================================================================
  // TEST 4: Employee starts pickup task -> started_at set
  // ================================================================
  console.log("\n-- TEST 4: Start Pickup Task --");

  const startPickup = await api("PATCH", "/tasks/" + pickupTaskId + "/status", eTok, {
    status: "in_progress",
  });
  assert(startPickup.success, "Pickup task started");
  assert(startPickup.data?.status === "in_progress", "Status is in_progress: " + startPickup.data?.status);
  assert(!!startPickup.data?.started_at, "started_at timestamp is set");
  assert(!startPickup.data?.completed_at, "completed_at is still null");

  // Order status should update to picked_up
  const orderAfterStart = await api("GET", "/orders/" + orderId, cTok);
  assert(
    orderAfterStart.data?.status === "picked_up",
    "Order status is picked_up: " + orderAfterStart.data?.status
  );

  // ================================================================
  // TEST 5: Employee completes pickup task -> completed_at set
  // ================================================================
  console.log("\n-- TEST 5: Complete Pickup Task --");

  const completePickup = await api("PATCH", "/tasks/" + pickupTaskId + "/status", eTok, {
    status: "completed",
  });
  assert(completePickup.success, "Pickup task completed");
  assert(completePickup.data?.status === "completed", "Status is completed: " + completePickup.data?.status);
  assert(!!completePickup.data?.started_at, "started_at is preserved");
  assert(!!completePickup.data?.completed_at, "completed_at timestamp is set");

  // Order status should now be processing (after pickup completed)
  const orderAfterPickup = await api("GET", "/orders/" + orderId, cTok);
  assert(
    orderAfterPickup.data?.status === "processing",
    "Order status is processing: " + orderAfterPickup.data?.status
  );

  // ================================================================
  // TEST 6: Employee A starts and completes wash task
  // ================================================================
  console.log("\n-- TEST 6: Wash Task Lifecycle --");

  const startWash = await api("PATCH", "/tasks/" + washTaskId + "/status", eTok, {
    status: "in_progress",
  });
  assert(startWash.success, "Wash task started");

  const completeWash = await api("PATCH", "/tasks/" + washTaskId + "/status", eTok, {
    status: "completed",
  });
  assert(completeWash.success, "Wash task completed");
  assert(!!completeWash.data?.started_at, "Wash started_at is set");
  assert(!!completeWash.data?.completed_at, "Wash completed_at is set");

  // Order status should now be ready_for_delivery
  const orderAfterWash = await api("GET", "/orders/" + orderId, cTok);
  assert(
    orderAfterWash.data?.status === "ready_for_delivery",
    "Order status is ready_for_delivery: " + orderAfterWash.data?.status
  );

  // ================================================================
  // TEST 7: Admin assigns delivery task to Employee B
  // ================================================================
  console.log("\n-- TEST 7: Assign Delivery Task --");

  const deliveryTask = await api("POST", "/tasks", aTok, {
    order_id: orderId,
    employee_id: empBId,
    task_type: "delivery",
    scheduled_time: "2026-08-22T14:00",
    priority: "normal",
    notes: "Leave at reception",
  });
  assert(deliveryTask.success, "Delivery task assigned to Employee B");
  const deliveryTaskId = deliveryTask.data?.id;

  // Employee B logs in and processes delivery
  const empBLogin = await api("POST", "/auth/login", null, {
    email: "testempB" + ts + "@example.com",
    password: "Emp@12345",
  });
  assert(empBLogin.success, "Employee B login successful");
  const eBTok = empBLogin.token;

  const startDelivery = await api("PATCH", "/tasks/" + deliveryTaskId + "/status", eBTok, {
    status: "in_progress",
  });
  assert(startDelivery.success, "Delivery task started");

  const completeDelivery = await api("PATCH", "/tasks/" + deliveryTaskId + "/status", eBTok, {
    status: "completed",
  });
  assert(completeDelivery.success, "Delivery task completed");

  // Order should now be delivered
  const finalOrder = await api("GET", "/orders/" + orderId, cTok);
  assert(
    finalOrder.data?.status === "delivered",
    "Order status is delivered: " + finalOrder.data?.status
  );

  // ================================================================
  // TEST 8: Admin Task History
  // ================================================================
  console.log("\n-- TEST 8: Admin Task History --");

  const adminHistory = await api("GET", "/tasks/history", aTok);
  assert(adminHistory.success, "Admin can fetch task history");
  assert(Array.isArray(adminHistory.data), "History is an array");

  // Find our test tasks in history
  const historyPickup = adminHistory.data?.find(function(t) { return t.id === pickupTaskId; });
  const historyWash = adminHistory.data?.find(function(t) { return t.id === washTaskId; });
  const historyDelivery = adminHistory.data?.find(function(t) { return t.id === deliveryTaskId; });

  assert(!!historyPickup, "Pickup task appears in admin history");
  assert(historyPickup?.status === "completed", "Pickup status is completed in history");
  assert(!!historyPickup?.started_at, "Pickup started_at is in history");
  assert(!!historyPickup?.completed_at, "Pickup completed_at is in history");

  assert(!!historyWash, "Wash task appears in admin history");
  assert(!!historyWash?.started_at, "Wash started_at is in history");
  assert(!!historyWash?.completed_at, "Wash completed_at is in history");

  assert(!!historyDelivery, "Delivery task appears in admin history");

  // Test admin history filters
  const filteredByEmp = await api("GET", "/tasks/history?employee_id=" + empAId, aTok);
  assert(filteredByEmp.success, "Admin history filter by employee works");
  assert(
    filteredByEmp.data?.every(function(t) { return t.employee_id === empAId; }),
    "Filtered results only show Employee A tasks"
  );

  const filteredByType = await api("GET", "/tasks/history?task_type=pickup", aTok);
  assert(filteredByType.success, "Admin history filter by task type works");
  assert(
    filteredByType.data?.every(function(t) { return t.task_type === "pickup"; }),
    "Filtered results only show pickup tasks"
  );

  const filteredByStatus = await api("GET", "/tasks/history?status=completed", aTok);
  assert(filteredByStatus.success, "Admin history filter by status works");
  assert(
    filteredByStatus.data?.every(function(t) { return t.status === "completed"; }),
    "Filtered results only show completed tasks"
  );

  const filteredByOrder = await api("GET", "/tasks/history?order_id=" + orderId, aTok);
  assert(filteredByOrder.success, "Admin history filter by order ID works");
  assert(
    filteredByOrder.data?.every(function(t) { return t.order_id === orderId; }),
    "Filtered results only show tasks for this order"
  );

  // ================================================================
  // TEST 9: Employee Task History
  // ================================================================
  console.log("\n-- TEST 9: Employee Task History --");

  const empHistory = await api("GET", "/tasks/my-history", eTok);
  assert(empHistory.success, "Employee can fetch their task history");
  assert(Array.isArray(empHistory.data), "Employee history is an array");

  // Employee A should see pickup + wash tasks
  const empHistPickup = empHistory.data?.find(function(t) { return t.id === pickupTaskId; });
  const empHistWash = empHistory.data?.find(function(t) { return t.id === washTaskId; });
  assert(!!empHistPickup, "Employee A sees pickup task in history");
  assert(empHistPickup?.status === "completed", "Pickup status is completed");
  assert(!!empHistPickup?.started_at, "Pickup started_at in employee history");
  assert(!!empHistPickup?.completed_at, "Pickup completed_at in employee history");

  assert(!!empHistWash, "Employee A sees wash task in history");

  // Employee A should NOT see delivery task (assigned to Employee B)
  const empHistDelivery = empHistory.data?.find(function(t) { return t.id === deliveryTaskId; });
  assert(!empHistDelivery, "Employee A does NOT see Employee B delivery task");

  // Employee B should see delivery task
  const empBHistory = await api("GET", "/tasks/my-history", eBTok);
  assert(empBHistory.success, "Employee B can fetch their task history");
  const empBDelivery = empBHistory.data?.find(function(t) { return t.id === deliveryTaskId; });
  assert(!!empBDelivery, "Employee B sees delivery task in their history");
  assert(empBDelivery?.status === "completed", "Delivery status is completed in B history");

  // Employee B should NOT see pickup or wash tasks
  const empBPickup = empBHistory.data?.find(function(t) { return t.id === pickupTaskId; });
  assert(!empBPickup, "Employee B does NOT see Employee A pickup task");

  // Test employee history filters
  const empHistFiltered = await api("GET", "/tasks/my-history?task_type=pickup", eTok);
  assert(empHistFiltered.success, "Employee history filter by task type works");
  assert(
    empHistFiltered.data?.every(function(t) { return t.task_type === "pickup"; }),
    "Filtered results only show pickup tasks for employee"
  );

  const empHistCompleted = await api("GET", "/tasks/my-history?status=completed", eTok);
  assert(empHistCompleted.success, "Employee history filter by status works");

  // ================================================================
  // TEST 10: Verify customer also sees order updates
  // ================================================================
  console.log("\n-- TEST 10: Customer Order Tracking --");

  const custOrder = await api("GET", "/orders/" + orderId, cTok);
  assert(custOrder.data?.status === "delivered", "Customer sees order as delivered");
  assert(!!custOrder.data?.delivery_time, "delivery_time is set");

  // ================================================================
  // CLEANUP
  // ================================================================
  console.log("\n-- CLEANUP --");
  await api("DELETE", "/admin/employees/" + empAId, aTok);
  await api("DELETE", "/admin/employees/" + empBId, aTok);
  console.log("  Test employees cleaned up");

  // ================================================================
  // SUMMARY
  // ================================================================
  console.log("\n==================================================");
  console.log("  RESULTS: " + passed + " passed, " + failed + " failed");
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(function(e) {
  console.error("TEST ERROR:", e.message);
  process.exit(1);
});
