# ShareEat Comprehensive Testing Checklist

This guide provides step-by-step instructions to verify the complete workflow of the ShareEat application, including "Happy Paths" and critical "Corner Cases".

## 1. System Access & Credentials

All passwords are: `password123`

| Role | Username | Organization/Name | Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | `shafiullahshafin` | ShareEat Admin | Superuser access to Admin Panel |
| **Donor** | `kfc` | KFC Dhanmondi | Has active inventory items |
| **Donor** | `agora` | Agora Superstore | Has pending donations |
| **Recipient** | `sos` | SOS Children's Village | Active recipient |
| **Recipient** | `bidyanondo` | Bidyanondo Foundation | Active recipient |
| **Volunteer** | `rahim` | Rahim Uddin | Motorcycle (20kg capacity) |
| **Volunteer** | `karim` | Karim Mia | Van (100kg capacity) |
| **Volunteer** | `suman` | Suman Ahmed | Bicycle (10kg capacity) |

**URLs:**

- **Web App:** [http://localhost:3000](http://localhost:3000)
- **API:** [http://localhost:8000](http://localhost:8000)
- **Admin Panel:** [http://localhost:8000/admin](http://localhost:8000/admin)

---

## 2. Core Workflow Verification (The "Happy Path")

**Goal:** Verify a standard donation cycle: Create -> Request -> Assign -> Deliver -> Rate.

### Step 1: Donor Creates Inventory

1. Login as **Donor** (`Status`).
2. Go to Dashboard -> **Quick Action (Donate Food)**.
3. Create a new item (e.g., "Chicken Buckets", 10kg, Expires in 24h).
4. Verify the item appears in **Active Listings**.

### Step 2: Recipient Requests Item

1. Login as **Recipient** (`sos`) in a new browser/incognito window.
2. Go to **Find Food**.
3. Locate "Chicken Buckets" from KFC.
4. Click **Request Item**.
5. Verify status is **"Pending Approval"** in "My Requests".

### Step 3: Donor Approves Request

1. Switch back to **Donor** (`kfc`).
2. Check **Incoming Requests** on Dashboard.
3. Click **Review Request** -> **Approve**.
4. **Result:** Status changes to "Confirmed". System automatically triggers the Volunteer Matching Algorithm.

### Step 4: Volunteer Accepts Delivery

1. Login as **Volunteer** (`rahim`) in a new window.
2. Go to **Dashboard** (redirects to "My Deliveries").
3. Check **Incoming Requests** section. You should see the request from KFC -> SOS.
4. Click **Accept Delivery**.
5. **Result:** Status becomes "Assigned" / "On the Way".

### Step 5: Delivery & Completion

1. As **Volunteer** (`rahim`), click **Mark Picked Up** (Simulates pickup).
2. Click **Mark Delivered** (Simulates drop-off).
3. **Result:** Donation status updates to "Delivered".

### Step 6: Recipient Rating

1. Switch back to **Recipient** (`sos`).
2. Refresh **My Requests**.
3. You should see a **"Confirm Receipt"** button (only visible after delivery).
4. Click it -> Rate the volunteer (0-5 stars).
5. **Result:** Transaction marked "Completed". Volunteer rating updates.

---

## 3. Corner Case Verification

### Case A: Volunteer Rejection Loop

**Scenario:** The best-matched volunteer rejects the request. The system must assign it to the *next* best volunteer.

1. **Setup:** Ensure `rahim` and `karim` are both "Available" (toggle on dashboard).
2. **Trigger:** Create a donation request (Donor: `agora` -> Recipient: `bidyanondo`). Approve it.
3. **Action:**
   - Login as `rahim` (Best match).
   - See request -> Click **Reject**.
4. **Verification:**
   - Request disappears from `rahim`'s dashboard.
   - Login as `karim` (Next best match).
   - Verify the *same* request now appears on `karim`'s dashboard.

### Case B: Admin Fallback (All Volunteers Unavailable)

**Scenario:** All volunteers reject or are unavailable. Admin gets notified.

1. **Setup:** Set all volunteers (`rahim`, `karim`, `suman`) to **"Not Available"** via their dashboards OR have them all reject a specific request.
2. **Trigger:** Create & Approve a new donation.
3. **Verification:**
   - Check Admin Email (Console logs or `mailpit` if configured, otherwise check backend logs for "Sending email to ```shafiullahshafin00@gmail.com```).
   - Login as **Admin** (`shafiullahshafin`).
   - Go to Admin Panel -> Donations.
   - Manually assign a volunteer to the "Confirmed" donation that has no assignee.

### Case C: Cancellation & Inventory Restoration

**Scenario:** A request is cancelled (by donor or recipient) before completion. Item quantity must return to inventory.

1. **Pre-check:** Note the quantity of an item in Donor Dashboard (e.g., 50kg Rice).
2. **Action:**
   - Recipient requests 10kg. (Inventory shows 40kg).
   - Donor **Rejects** the request OR Recipient **Cancels** it.
3. **Verification:**
   - Go back to Donor Dashboard.
   - Inventory should be restored to **50kg**.

---

## 4. Visual & UI Checks

### Global Donation Page

1. Go to `/donations` (accessible to all authenticated users).
2. Verify the table columns:
   - **Start of Line:** Check for ✅ (Completed) or ❌ (Cancelled) or 🕒 (Pending) icons.
   - **Status Badge:** Check for colored badges (e.g., "On The Way" in blue).
   - **Volunteer Column:** Should show "Rahim" (or "Not Assigned").
   - **Volunteer Status:** Should show "Assigned", "Picked Up", etc.

### Volunteer Access Control

1. Login as **Volunteer** (`rahim`).
2. Verify **"Food Items"** is NOT visible in the Navbar.
3. Try to manually navigate to `http://localhost:3000/food-items`.
4. **Result:** Should redirect to Dashboard or show "Access Denied" (Home).

### Volunteer Availability

1. Login as **Volunteer**.
2. Click the **"Available" / "Not Available"** toggle button in the top right of the dashboard.
3. Verify the text and icon change color (Green/Gray).
