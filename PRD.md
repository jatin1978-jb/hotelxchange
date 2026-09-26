HOSPITALITY DIGITAL
Product Requirements Document (PRD) | Development Specification
Version 1.2 • 23 September 2026 • Status: Development baseline with configurable values explicitly marked TBD
Product promise: Every guest request. One operational workflow.
Document Control
Field
Value
Product
Hospitality Digital
Document purpose
Define MVP scope, user journeys, business rules, functional requirements, data model, integrations, acceptance criteria, and test scenarios for development.
Target release
Single-property pilot / prototype
Primary users
Hotel guests, staff, department supervisors, operations supervisors, administrator
Scope baseline
Guest QR/web access; six departments; auto-routing and round-robin assignment; SLA tracking; supervisor escalation; F&B menu/order flow; dashboards.
Decision handling
Confirmed product decisions are specified. Numerical thresholds and certain operational policies remain admin-configurable or TBD; do not hard-code them.
1. Executive Summary
Hospitality Digital is a guest-request intake and hotel-operations workflow platform. A guest scans a room-specific QR code or opens its web link, submits a request or F&B order, and receives a persistent tracking link. The system creates a request, determines category/priority and responsible department, assigns an eligible staff member using round-robin, starts SLA measurement at submission, and tracks acceptance through fulfillment. Staff work from individual queues; supervisors and operations use centralized dashboards. Missed acceptance deadlines notify the supervisor for manual reassignment. Guest-facing completion notifications and optional 1–5 feedback close the loop.
2. Product Goals and Non-Goals
2.1 Goals
Show the complete guest journey from QR scan through request completion and feedback.
Centralize request visibility and operational ownership across six departments.
Reduce missed requests and make response/fulfillment performance measurable through SLA tracking, alerts, and dashboards.
Demonstrate configurable workflows without requiring PMS/POS/CRM integration for the prototype.
Provide a clear, usable guest experience on mobile web without requiring app installation.
2.2 Non-goals for MVP
No native iOS/Android application.
No guest account creation or identity verification; room-specific QR/link is the prototype access mechanism.
No payment, folio posting, settlement, refunds, or F&B cancellation.
No request reopening after completion.
No automatic supervisor reassignment after acceptance timeout; alert supervisor and require manual reassignment.
No production PMS/POS/CRM integrations unless separately approved; integration depth is validated during pilot.
No multi-property administration in the initial pilot; design data model to support property scoping.
3. Pilot Scope and Departments
Department
Representative request examples (configurable)
Operational role
Housekeeping
Towels, amenities, cleaning, linen
Receive and fulfill assigned guest requests
Engineering
AC, lighting, plumbing, appliance issue
Receive and fulfill maintenance requests
F&B
Browse menu, submit food/beverage order
Prepare, mark ready, deliver
Concierge
Local information, transport, reservations assistance
Handle guest assistance requests
Front Office
Checkout question, key/card help, general inquiry
Handle front-desk requests
Service Recovery
Direct complaints and escalated cases
Own complaint/escalation workflows; supervisor may override
All six departments are included in the single-property prototype. Request categories, staff eligibility, SLA targets, acceptance timeouts, warning thresholds, and routing rules are managed through configuration.
4. Personas and Permissions
Role
Core capabilities
Restrictions / notes
Guest
Access room-linked guest page; browse F&B menu; submit request/order; view status/history through persistent link; receive updates; submit optional 1–5 rating
No login or identity verification in prototype; access is bounded by configured link expiry.
Staff
View own queue; accept; update permitted statuses; add internal notes; complete assigned work; see request context
May act only on assigned/authorized department work.
Department Supervisor
View department queue; receive acceptance-timeout and low-rating alerts; manually reassign; oversee workload; apply permitted override
Reassignment and ownership changes must be audited.
Operations Supervisor
Central dashboard across departments; monitor aging/SLA; coordinate cross-department work; handle escalations according to permissions
Cross-department reassignment governed by configured rules.
Administrator
Manage categories, departments, staff, eligibility, round-robin pools, SLA and timeout settings, priority rules, alert thresholds, link expiry, menus/modifiers, QR-room mapping, and access
Administrative changes should be logged.
5. Core End-to-End Workflows
5.1 Guest service request
Guest scans room-specific QR code or opens room-specific web link.
System resolves property and room context; guest sees mobile guest home.
Guest selects a configured request category, enters required details, and optionally selects urgency from configured options.
On successful submission, system creates a unique request ID, records room/category/time, calculates priority, starts SLA clock immediately, and determines the responsible department.
System identifies eligible, active staff for the category/department and assigns the next staff member using round-robin.
Guest sees confirmation and tracking link; the request appears in the assigned staff queue and supervisor/operations views.
Staff accepts the request. If acceptance is not recorded before the category’s configured timeout, notify the department supervisor; supervisor manually reassigns.
Staff progresses the request and marks it complete when fulfilled.
System records completion time, stops the applicable fulfillment SLA, notifies guest, and offers optional 1–5 rating.
If guest submits a low rating according to the configured threshold, alert the supervisor.
5.2 F&B order
Guest opens F&B from the room-linked guest page and browses the configured menu.
Guest selects items, quantities, available modifiers, and optional special instructions.
Guest reviews order summary and submits. No payment or settlement is collected.
System creates an F&B request/order, starts SLA at submission, assigns to eligible F&B staff using round-robin, and provides tracking.
F&B staff updates fulfillment state: Preparing → Ready → Delivered. The configured F&B fulfillment SLA ends at Delivered to guest.
Guest receives relevant status notifications. Cancellation is not supported in the prototype.
5.3 Service Recovery / complaint
Guest may submit a complaint directly through a configured Service Recovery category, or an existing request may be escalated according to configurable rules or supervisor override.
On transfer to Service Recovery, the same request record changes owner/department; do not create a linked subtask.
Preserve request ID, timestamps, previous ownership, status history, notes, and SLA history.
Service Recovery supervisor/staff handles the request under configured priority and SLA rules.
Guest receives status updates and completion notification; optional rating may trigger a supervisor alert.
5.4 Acceptance timeout and manual reassignment
At assignment, start acceptance timeout using the category-specific configured duration.
If no staff acceptance by deadline, notify the responsible supervisor and mark the acceptance timeout event.
Supervisor reviews the request and manually selects a replacement eligible staff member.
Record reassignment actor, previous assignee, new assignee, timestamp, and reason (reason may be required by configuration).
Do not reset the original request submission time or SLA clock. A new acceptance deadline may be applied based on configured repeated-timeout policy (TBD).
6. Functional Requirements
ID
Requirement
Specification
FR-001
Room QR/link resolution
System shall map each room-specific QR URL to the correct property and room context. Invalid, disabled, or expired links shall show a safe error and a route to contact Front Office.
FR-002
Guest request submission
Guest shall submit a configured request category with required fields and optional details/urgency. Validate required fields and prevent duplicate submissions caused by repeated taps.
FR-003
Request creation
Successful submission shall create a unique request record with created_at, room, category, priority, source, current status, and audit event.
FR-004
SLA start
SLA measurement shall start at guest submission, use continuous 24/7 elapsed time, and not pause outside operating hours.
FR-005
Category configuration
Admin shall create/edit/disable categories and map each category to a department, required fields, eligible staff pool, SLA target, acceptance timeout, and applicable priority/routing rules.
FR-006
Priority calculation
Priority shall be derived from configured category rules plus guest-selected urgency. Exact urgency labels and matrix are configurable/TBD; no hard-coded priority matrix.
FR-007
Round-robin assignment
System shall assign to the next eligible active staff member in the configured round-robin pool. Maintain deterministic rotation state per configured pool; pool granularity (department vs category) remains an admin/product decision.
FR-008
Staff eligibility
Admin shall configure staff eligibility by department/category. Ineligible or inactive staff must never receive automated assignments.
FR-009
Staff queue
Staff shall see assigned requests with room, category, priority, age, SLA status, guest details provided, and action controls.
FR-010
Accept request
Assigned staff shall accept a request; record accepted_at and actor. Acceptance timer ends on valid acceptance.
FR-011
Acceptance timeout
System shall compare elapsed time since assignment with category-configured acceptance timeout and generate a supervisor alert if not accepted.
FR-012
Supervisor reassignment
Supervisor shall manually reassign to an eligible staff member; preserve full assignment history and SLA continuity.
FR-013
Request lifecycle
Support configured lifecycle states including New/Assigned, Accepted, In Progress, Completed; show state transitions and timestamps. F&B uses its own specified fulfillment states.
FR-014
Completion and guest notification
Authorized staff shall mark work complete. System shall record completed_at, stop fulfillment SLA, and notify guest through the guest tracking experience and configured notification channel.
FR-015
Persistent tracking
Guest shall receive a room-specific persistent tracking link for viewing request status. Link expires after a configured duration; expiry basis and post-expiry recovery behavior remain TBD.
FR-016
Guest notifications
Show confirmation and status updates in the guest tracking page; external SMS/email/WhatsApp delivery is not assumed unless channel and provider are configured.
FR-017
F&B menu
Admin shall manage menu sections, items, descriptions, availability, prices as display data, modifiers, modifier choices, and special-instruction allowance. Prices do not initiate payment or settlement.
FR-018
F&B cart/order
Guest shall add/remove items and adjust quantities before submission; validate availability and modifier requirements. No post-submission cancellation in MVP.
FR-019
F&B fulfillment
F&B staff shall update Preparing → Ready → Delivered. Delivered is the SLA completion milestone.
FR-020
Service Recovery
Support direct complaints and configured escalation/override to Service Recovery. Transfer changes owner on the same request record; no linked subtask.
FR-021
Feedback
After completion, guest may optionally submit one rating from 1 to 5. No written review required in MVP.
FR-022
Low-rating alert
When rating meets configured low-rating condition, alert the responsible supervisor. Exact threshold and whether a follow-up task is created remain TBD; MVP requirement is alert only.
FR-023
SLA warnings/escalations
Admin shall configure warning/escalation thresholds by department. System shall evaluate thresholds continuously and create alerts/events. Category override behavior is TBD.
FR-024
Central operations dashboard
Provide cross-department queue and KPI views: request volume, open/aging requests, SLA at risk/breached, response time, completion time, department/category distribution, and F&B order status.
FR-025
Department dashboard
Provide supervisor view for department workload, pending acceptance, SLA risk/breach, assignment and reassignment actions, and low-rating alerts.
FR-026
Audit trail
Record request creation, status changes, assignment/reassignment, escalation/transfer, configuration changes, notifications, feedback, and relevant actor/time.
FR-027
Admin controls
Admin shall configure departments, staff, roles, eligibility, category mapping, priority rules, SLA targets, acceptance timeouts, alert thresholds, link expiry, F&B menu, and room QR mappings.
FR-028
No reopening
Completed requests cannot be reopened in MVP. Guest needing additional help submits a new request.
FR-029
No settlement
F&B orders do not collect payment, post to a folio, or reconcile settlement in MVP.
FR-030
Single-property pilot
All operational data and dashboards shall be scoped to the pilot property, while identifiers/data design should not prevent future multi-property extension.
7. Request Status Model and Transitions
Object
State / event
Meaning / rule
General request
Submitted / Assigned
Request created; SLA starts at submission; assignment selected.
General request
Accepted
Assigned staff acknowledges; acceptance timer ends.
General request
In Progress
Staff has started fulfillment.
General request
Completed
Work fulfilled; completion timestamp recorded; fulfillment SLA ends; guest notified.
F&B order
Submitted / Assigned
Order accepted into workflow; SLA starts at submission.
F&B order
Preparing
Kitchen/F&B preparation underway.
F&B order
Ready
Order is ready for delivery.
F&B order
Delivered
Order delivered to guest; F&B fulfillment SLA stops.
Cross-cutting event
Acceptance timeout
No acceptance by configured deadline; supervisor alert, not automatic reassignment.
Cross-cutting event
Service Recovery transfer
Same request changes owner/department; preserve history and SLA context.
Cross-cutting event
Low rating
Optional rating received; alert if configured low-rating rule is met.
Implementation note: distinguish request lifecycle status from assignment state, SLA state, and alert/event records. This avoids conflating a request’s work status with a timeout or warning.
8. Configuration and Business Rules
Configuration
Required behavior
Initial value
Category → department
Each active category maps to one default department; Service Recovery transfer may change owner.
Admin-configured
Eligible staff
Category/department-specific eligibility and active flag.
Admin-configured
Round-robin pool
Ordered/rotating set of eligible staff; skip inactive/unavailable members.
Round-robin confirmed; pool granularity TBD
Priority
Category + guest-selected urgency; configured mapping.
Options/matrix TBD
SLA target
Per request category; continuous 24/7 from submission.
Numeric targets TBD
Acceptance timeout
Per request category; measured from assignment.
Numeric values TBD
Warning/escalation thresholds
Per department; configured by admin.
Numeric values TBD
Repeated acceptance timeout
Define alert/reassignment loop after first timeout.
TBD
Tracking link expiry
Persistent room-specific link expires after configured duration.
Duration and clock basis TBD
Low rating trigger
Supervisor alert for configured low rating.
Threshold TBD
F&B menu
Items, prices for display, modifiers, special instructions, availability.
Admin-configured
F&B SLA endpoint
Delivered to guest.
Confirmed
Operating hours
SLA clock remains continuous 24/7.
Confirmed
9. UX / Screen Inventory
Surface
Screen / view
Key content and actions
Guest mobile web
Room landing page
Property/room context, request categories, F&B entry, help/contact fallback.
Guest mobile web
Request form
Category, required questions, details, urgency options, submit.
Guest mobile web
Confirmation/tracking
Request ID, current state, submission time, status timeline, expiry information.
Guest mobile web
F&B menu
Sections, item details, availability, modifiers, special instructions, cart.
Guest mobile web
F&B order tracking
Preparing → Ready → Delivered timeline.
Guest mobile web
Feedback
Optional 1–5 rating after completion.
Staff web/tablet
My queue
Assigned work, priority, age, SLA indicator, accept/start/complete controls.
Staff web/tablet
Request detail
Room, category, guest-provided details, timeline, internal notes, actions.
Supervisor
Department queue
Pending acceptance, workload, SLA risk/breach, reassign, alerts.
Operations
Central dashboard
All departments, filters, operational KPIs, aging and SLA overview.
Admin
Configuration console
Categories, mappings, staff eligibility, SLA/timeouts, thresholds, QR links, menu/modifiers, link expiry.
10. Dashboard Metrics and Definitions
Metric
Definition / implementation note
Requests created
Count of submitted requests in selected time range.
Open requests
Requests not in terminal Completed/Delivered state.
Acceptance time
accepted_at minus submitted_at (report median and percentile where useful).
Fulfillment time
completed_at/delivered_at minus submitted_at.
Within-SLA rate
Eligible completed requests completed within configured target ÷ eligible completed requests; expose denominator and time window.
SLA breaches
Count of requests whose applicable target was exceeded.
At-risk requests
Open requests past configured warning threshold but not yet breached.
Acceptance timeout count
Assignments that exceeded configured acceptance timeout before acceptance.
Reassignment count
Number of assignment changes per request and in aggregate.
F&B digital share
Digital F&B orders divided by total F&B orders only if total-order data is available; otherwise label as digital order count, not share.
Feedback distribution
Count/percentage of ratings 1–5; low-rating alerts counted separately.
Any sample KPI values shown in the concept material are illustrative, not acceptance targets or guaranteed outcomes.
11. Data Model (Logical)
Entity
Key fields (illustrative)
Relationships / notes
Property
id, name, timezone, status
One pilot property; parent scope for rooms, users, requests, configuration.
Room
id, property_id, room_number, qr_token, link_status
QR token must be non-guessable; map to room context.
User
id, property_id, name, role, active
Staff/admin identities; authentication approach to be selected.
Department
id, property_id, name, supervisor_id, active
Six seeded departments.
Category
id, department_id, name, form_schema, priority_rule_id, sla_policy_id, acceptance_policy_id, active
Configurable category routing.
StaffEligibility
user_id, department_id, category_id, eligible, active
Many-to-many eligibility.
Request
id, property_id, room_id, category_id, type, priority, status, created_at, completed_at, current_department_id, current_assignee_id, tracking_token_hash
Canonical request record; F&B orders may use type=F&B.
AssignmentHistory
id, request_id, assignee_id, department_id, assigned_at, accepted_at, ended_at, actor_id, reason
Append-only ownership history; supports round-robin audit.
RequestEvent
id, request_id, event_type, from_value, to_value, actor_id, occurred_at, metadata
Timeline and audit trail.
SlaPolicy
id, category_id, target_duration, warning_thresholds, escalation_thresholds, enabled
Durations configurable; continuous elapsed time.
AcceptancePolicy
id, category_id, timeout_duration, repeat_timeout_behavior
Repeat behavior TBD.
Notification
id, request_id, recipient, channel, template, status, created_at, sent_at
Channel implementation configurable; in-app/guest tracking baseline.
MenuSection
id, property_id, name, sort_order, active
F&B menu.
MenuItem
id, section_id, name, description, display_price, available, modifier_group_ids
No payment processing.
ModifierGroup/Option
id, group_id, label, required, min/max, option_label, display_price_delta
Supports required/optional modifiers.
OrderLine
id, request_id, menu_item_id, quantity, selected_modifiers, special_instructions, item_snapshot
Snapshot preserves submitted order details.
Feedback
id, request_id, rating_1_to_5, created_at
Optional one rating; alert rule configurable.
Alert
id, property_id, request_id, type, severity, assigned_supervisor_id, status, created_at, resolved_at
Acceptance timeout, SLA, low rating, escalation.
AdminAudit
id, actor_id, action, entity_type, entity_id, before/after, occurred_at
Configuration change audit.
12. API / Service Boundaries (Implementation Guidance)
These are suggested logical endpoints, not a mandated framework or final API contract. Use authenticated staff/admin APIs and room-token guest APIs with rate limiting and validation.
Capability
Example operation
Room context
GET /guest/rooms/{roomToken}/context
Guest categories
GET /guest/rooms/{roomToken}/categories
Create request
POST /guest/rooms/{roomToken}/requests
Guest tracking
GET /guest/tracking/{trackingToken}
Menu
GET /guest/rooms/{roomToken}/menu
Create F&B order
POST /guest/rooms/{roomToken}/orders
Staff queue
GET /staff/requests?queue=mine
Accept / progress / complete
POST /staff/requests/{id}/accept; PATCH /staff/requests/{id}/status
Reassign
POST /supervisor/requests/{id}/reassign
Transfer to Service Recovery
POST /supervisor/requests/{id}/transfer
Dashboards
GET /operations/metrics; GET /supervisor/queues
Admin configuration
CRUD endpoints for categories, staff eligibility, policies, QR mapping, menus.
13. Non-Functional Requirements
Responsive mobile-first guest UI; staff/supervisor views usable on desktop and tablet.
Role-based authorization for staff, supervisors, operations, and admin actions.
Secure random room and tracking tokens; store token hashes where practical; avoid exposing sequential room IDs.
Validate and sanitize guest text, special instructions, and configuration inputs.
Audit all ownership changes, state transitions, and administrative policy changes.
Use server timestamps as authoritative source for SLA and audit calculations; store timezone per property for display.
Reliable idempotency for guest submission and order submission to prevent duplicate requests on retries.
Graceful handling of unavailable/inactive assignees and no eligible staff: create unassigned exception and alert supervisor rather than silently dropping request.
Configurable notification adapter; failure to deliver an external notification must not erase request or timeline state.
Provide basic operational error logging, health monitoring, and backup/restore appropriate to pilot.
14. Security, Privacy, and Access
Guest links grant access only to the request(s) associated with that room/session/token; tracking token scope must be explicitly enforced.
Do not collect guest identity unless separately approved; guest-entered details should be limited to what is operationally necessary.
Staff authentication and role checks required for all operational actions.
Prevent cross-room data leakage: guest tracking responses must not expose other rooms’ requests.
Record actor and timestamp for staff/supervisor/admin actions.
Define retention and deletion policy before production deployment; pilot retention duration is TBD.
15. Error and Edge Cases
Scenario
Expected behavior
Invalid/disabled QR
Show friendly invalid-link page; do not reveal room details; provide Front Office fallback.
No eligible staff
Keep request visible as unassigned; alert supervisor/operations; do not drop or falsely assign.
Staff becomes inactive after assignment
Supervisor queue flags assignment; allow manual reassignment; define automatic handling before production.
Repeated submit tap/network retry
Use idempotency key or equivalent to avoid duplicate request/order.
Menu item becomes unavailable before submit
Reject unavailable line and ask guest to review cart; do not silently substitute.
Notification provider fails
Persist request/status; record delivery failure and retry according to configured policy.
Guest opens expired tracking link
Show expiry message and safe route to reacquire help; exact behavior TBD.
Staff attempts invalid transition
Reject with clear message; preserve current status and audit failed attempt if required.
Service Recovery transfer
Update same request owner; preserve original history and timestamps.
Low feedback rating
Save rating; trigger supervisor alert when configured condition matches.
Completed request needs more work
Do not reopen; guest submits a new request.
16. Acceptance Criteria
Room-specific QR opens the guest experience with correct room context and no login.
Guest can submit a valid service request; request ID and tracking link are created; SLA starts at submission.
Category mapping selects the correct department and configured eligible staff pool.
Round-robin assigns eligible staff consistently and skips inactive/ineligible users.
Staff queue shows assigned request and supports accept, in-progress, and completion transitions.
Acceptance timeout creates supervisor alert; no automatic reassignment occurs.
Supervisor can manually reassign; history is preserved and original SLA clock continues.
Guest tracking reflects current status and completion notification is visible.
F&B menu supports modifiers and special instructions; order submits without payment.
F&B order state sequence supports Preparing → Ready → Delivered; SLA stops at Delivered.
Service Recovery can receive direct complaints and same-record transfers; no linked subtask is created.
Optional 1–5 feedback is saved; configured low-rating rule generates supervisor alert.
Admin can configure category SLA and acceptance timeout values without code changes.
Operations dashboard displays request volume, open/aging work, SLA status, and department breakdown.
Completed requests cannot be reopened through staff UI/API.
Invalid QR, no eligible staff, duplicate submission, and notification failure paths are handled safely.
17. QA / Test Scenarios
Test ID
Scenario
Expected result
T-01
Submit a normal housekeeping request
Request created, correct room/category/department, SLA starts, eligible round-robin assignee selected.
T-02
Submit request with urgency selected
Priority follows configured category + urgency matrix.
T-03
All eligible staff inactive
Request remains visible as unassigned; supervisor alert created.
T-04
Staff accepts before timeout
Acceptance timestamp saved; no timeout alert.
T-05
Staff does not accept before timeout
Supervisor alert created; request remains pending assignment/acceptance.
T-06
Supervisor reassigns
New assignee receives request; previous assignment retained in history; SLA unchanged.
T-07
SLA warning and breach
Configured warning/breach events appear at expected elapsed times, including overnight.
T-08
Complete request
Completion timestamp saved, SLA stops, guest sees completed state and notification.
T-09
F&B modifier required but omitted
Submission blocked with validation.
T-10
F&B order lifecycle
Preparing, Ready, Delivered transitions work; SLA ends at Delivered.
T-11
F&B payment/cancel attempt
No payment or cancellation capability exposed in MVP.
T-12
Service Recovery transfer
Same request ID, owner changes, event history preserved.
T-13
Submit rating 1 and rating 5
Both saved; alert only when configured low-rating condition is met.
T-14
Open expired tracking link
Expiry-safe page shown; no unintended data disclosure.
T-15
Guest attempts another room’s tracking token
Access denied; no other room/request data returned.
T-16
Tap submit repeatedly / retry request
Only one logical request/order created.
T-17
Try reopening completed request
Action rejected; completed state unchanged.
T-18
Admin changes category SLA
New policy applies to requests according to documented effective-time policy (to be agreed).
18. Analytics / Event Instrumentation
request_submitted, assignment_created, request_accepted, request_started, request_completed
acceptance_timeout_triggered, supervisor_alert_created, request_reassigned
service_recovery_transfer, sla_warning_triggered, sla_breached
fnb_menu_viewed, fnb_item_added, fnb_order_submitted, fnb_order_preparing, fnb_order_ready, fnb_order_delivered
guest_tracking_viewed, guest_feedback_submitted, low_rating_alert_triggered
admin_configuration_changed, notification_delivery_failed
19. Build Plan / Suggested Milestones
Milestone
Deliverables
Exit condition
M1 — Foundation
Data model, property/room QR mapping, role model, seeded departments, basic authentication
Staff/admin access and room context validated.
M2 — Guest intake
Guest landing, category form, request creation, tracking token/page
End-to-end request submission works.
M3 — Routing & staff queue
Eligibility, round-robin, staff queue, accept/progress/complete
Requests route and move through lifecycle.
M4 — SLA & supervisor
Continuous SLA engine, timeout/warning alerts, manual reassignment, audit
Timeout and reassignment scenarios pass.
M5 — F&B
Menu, modifiers, cart, order submission, fulfillment statuses
Order delivered workflow passes without payment.
M6 — Service Recovery & feedback
Direct complaint, same-record transfer, 1–5 rating, low-rating alert
Escalation and feedback scenarios pass.
M7 — Dashboards & hardening
Operations/supervisor dashboards, metrics, security, edge cases, pilot UAT
Acceptance criteria signed off for one property.
20. Open Decisions — Must Resolve Before Production
These do not block building configurable scaffolding, but must be resolved before production configuration and final UAT.
Decision
Current state / required decision
Priority options and matrix
Define guest urgency choices, category base priorities, and combination rules.
Category SLA targets
Enter exact target durations for every active category.
Acceptance timeout values
Enter timeout duration for every category.
F&B SLA duration
Milestone is Delivered; define target duration(s) and whether there are intermediate milestones.
Round-robin pool granularity
Choose rotation per department or per category; define behavior on staff absence/unavailability.
Repeated timeout behavior
Define whether repeated timeout creates another alert, escalates to operations, or resets acceptance deadline.
SLA threshold precedence
Define interaction between department warning/escalation thresholds and category SLA policies.
Tracking link expiry
Set duration and whether expiry clock begins at request submission, completion, or another event.
Post-expiry access
Define whether guest can reacquire tracking via QR, Front Office, or no recovery.
Low-rating threshold
Choose which rating(s) trigger supervisor alert; follow-up task not included unless separately specified.
Effective policy changes
Define whether policy edits affect only new requests or also open requests.
Notification channels
Confirm whether guest updates are in-page only or also SMS/email/WhatsApp; choose provider if external.
Staff authentication
Choose login/SSO/password and account provisioning approach.
Retention
Set retention/deletion periods and production privacy requirements.
21. Source Alignment and Assumptions
This PRD follows the Hospitality Digital concept and the decisions confirmed during product clarification. The concept frames the platform as a workflow layer complementing PMS/POS/CRM and calls for pilot validation of integration depth. The MVP described here therefore does not assume integrations are already available. Illustrative management metrics in concept materials are not treated as contractual targets. Where exact numerical values or policy precedence were not confirmed, this document explicitly marks them configurable or TBD rather than inventing them.
Appendix A — MVP Release Checklist
☐ All six departments seeded and configurable.
☐ Room QR links tested for correct room context and invalid-link handling.
☐ Guest request, tracking, completion, and optional rating flow tested on mobile.
☐ F&B menu/modifiers/order/delivery flow tested; payment/cancel excluded.
☐ Staff eligibility and round-robin tested with active/inactive users.
☐ SLA clocks verified across nights/weekends (continuous 24/7).
☐ Acceptance timeout alerts and manual reassignment audited.
☐ Service Recovery direct complaint and same-record transfer tested.
☐ Supervisor and operations dashboards reconcile with request records.
☐ Security checks for room isolation, role authorization, and token expiry passed.
☐ Open production decisions resolved or explicitly accepted as pilot constraints.
☐ Pilot UAT completed for one property.