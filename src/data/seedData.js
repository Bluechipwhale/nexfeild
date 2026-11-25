const today = new Date()

const daysOffset = (count) => {
  const date = new Date(today)
  date.setDate(date.getDate() + count)
  return date.toISOString()
}

export const demoPassword = 'demo1234'

const starterMarkets = [
  { id: 'market-balogun', name: 'Balogun Market', zone: 'Lagos Island', state: 'Lagos', region: 'Lagos', coverageTarget: 120, managerId: '' },
  { id: 'market-yaba', name: 'Yaba Tech Market', zone: 'Yaba', state: 'Lagos', region: 'Lagos', coverageTarget: 80, managerId: '' },
  { id: 'market-ikorodu', name: 'Ikorodu Main Market', zone: 'Ikorodu', state: 'Lagos', region: 'Lagos', coverageTarget: 65, managerId: '' },
  { id: 'market-dugbe', name: 'Dugbe Market', zone: 'Ibadan Central', state: 'Oyo', region: 'West', coverageTarget: 74, managerId: '' },
  { id: 'market-kaduna', name: 'Kaduna Central Market', zone: 'Kaduna North', state: 'Kaduna', region: 'North', coverageTarget: 52, managerId: '' },
]

const starterStreets = [
  { id: 'street-broad', marketId: 'market-balogun', name: 'Broad Street', targetVisits: 18 },
  { id: 'street-campbell', marketId: 'market-balogun', name: 'Campbell Street', targetVisits: 15 },
  { id: 'street-herbert', marketId: 'market-balogun', name: 'Herbert Macaulay Way', targetVisits: 12 },
  { id: 'street-tejuosho', marketId: 'market-yaba', name: 'Tejuosho Road', targetVisits: 16 },
  { id: 'street-alagomeji', marketId: 'market-yaba', name: 'Alagomeji', targetVisits: 10 },
  { id: 'street-itaelewa', marketId: 'market-ikorodu', name: 'Ita-Elewa Road', targetVisits: 9 },
]

export const seedData = {
  users: [
    { id: 'user-super-admin', name: 'Ada Okafor', email: 'superadmin@routeforce360.app', password: demoPassword, role: 'Super Admin', phone: '+2348031112200', team: 'Executive', status: 'active', assignedRouteIds: ['route-balogun'], assignedVehicleIds: ['vehicle-001'], clockedIn: true, lastSeen: daysOffset(0), region: 'Lagos', state: 'Lagos', marketId: 'market-balogun', designation: 'Executive', createdAt: daysOffset(-30) },
    { id: 'user-admin', name: 'Chinedu Eze', email: 'admin@routeforce360.app', password: demoPassword, role: 'Admin', phone: '+2348035551000', team: 'Operations', status: 'active', assignedRouteIds: [], assignedVehicleIds: [], clockedIn: true, lastSeen: daysOffset(0), region: 'Lagos', state: 'Lagos', marketId: 'market-balogun', designation: 'Admin', createdAt: daysOffset(-26) },
    { id: 'user-supervisor', name: 'Kemi Alabi', email: 'supervisor@routeforce360.app', password: demoPassword, role: 'Supervisor', phone: '+2348062229900', team: 'Lagos Mainland', status: 'active', assignedRouteIds: ['route-yaba'], assignedVehicleIds: [], clockedIn: true, lastSeen: daysOffset(0), region: 'Lagos', state: 'Lagos', marketId: 'market-yaba', designation: 'GMI Supervisor', createdAt: daysOffset(-21) },
    { id: 'user-agent-1', name: 'Ifeanyi Obi', email: 'agent@routeforce360.app', password: demoPassword, role: 'Field Agent', phone: '+2348098901100', team: 'Coverage Squad', status: 'active', assignedRouteIds: ['route-balogun'], assignedVehicleIds: [], clockedIn: true, lastSeen: daysOffset(0), region: 'Lagos', state: 'Lagos', marketId: 'market-balogun', designation: 'GMI Promoter', createdAt: daysOffset(-18) },
    { id: 'user-driver', name: 'Amina Bello', email: 'driver@routeforce360.app', password: demoPassword, role: 'Driver', phone: '+2348023100700', team: 'Fleet', status: 'active', assignedRouteIds: [], assignedVehicleIds: ['vehicle-001'], clockedIn: true, lastSeen: daysOffset(0), region: 'Lagos', state: 'Lagos', marketId: 'market-balogun', designation: 'Driver', createdAt: daysOffset(-12) },
    { id: 'user-finance', name: 'Favour James', email: 'finance@routeforce360.app', password: demoPassword, role: 'Finance Officer', phone: '+2348073349200', team: 'Finance', status: 'active', assignedRouteIds: [], assignedVehicleIds: [], clockedIn: false, lastSeen: daysOffset(-1), region: 'West', state: 'Oyo', marketId: 'market-dugbe', designation: 'Finance Officer', createdAt: daysOffset(-10) },
    { id: 'user-viewer', name: 'Moses Danjuma', email: 'viewer@routeforce360.app', password: demoPassword, role: 'Viewer', phone: '+2348098889000', team: 'Audit', status: 'active', assignedRouteIds: [], assignedVehicleIds: [], clockedIn: false, lastSeen: daysOffset(-2), region: 'North', state: 'Kaduna', marketId: 'market-kaduna', designation: 'Viewer', createdAt: daysOffset(-8) },
    { id: 'user-client', name: 'Helix Consumer Holdings', email: 'client@routeforce360.app', password: demoPassword, role: 'Client', phone: '+2348037704400', team: 'Client Stakeholders', status: 'active', assignedRouteIds: [], assignedVehicleIds: [], clockedIn: false, lastSeen: daysOffset(0), region: 'Lagos', state: 'Lagos', marketId: 'market-balogun', designation: 'Client Executive', createdAt: daysOffset(-5) },
  ],
  markets: [
    { id: 'market-balogun', name: 'Balogun Market', zone: 'Lagos Island', state: 'Lagos', region: 'Lagos', coverageTarget: 120, managerId: 'user-supervisor' },
    { id: 'market-yaba', name: 'Yaba Tech Market', zone: 'Yaba', state: 'Lagos', region: 'Lagos', coverageTarget: 80, managerId: 'user-supervisor' },
    { id: 'market-ikorodu', name: 'Ikorodu Main Market', zone: 'Ikorodu', state: 'Lagos', region: 'Lagos', coverageTarget: 65, managerId: 'user-admin' },
    { id: 'market-dugbe', name: 'Dugbe Market', zone: 'Ibadan Central', state: 'Oyo', region: 'West', coverageTarget: 74, managerId: 'user-admin' },
    { id: 'market-kaduna', name: 'Kaduna Central Market', zone: 'Kaduna North', state: 'Kaduna', region: 'North', coverageTarget: 52, managerId: 'user-admin' },
  ],
  streets: [
    { id: 'street-broad', marketId: 'market-balogun', name: 'Broad Street', targetVisits: 18 },
    { id: 'street-campbell', marketId: 'market-balogun', name: 'Campbell Street', targetVisits: 15 },
    { id: 'street-herbert', marketId: 'market-balogun', name: 'Herbert Macaulay Way', targetVisits: 12 },
    { id: 'street-tejuosho', marketId: 'market-yaba', name: 'Tejuosho Road', targetVisits: 16 },
    { id: 'street-alagomeji', marketId: 'market-yaba', name: 'Alagomeji', targetVisits: 10 },
    { id: 'street-itaelewa', marketId: 'market-ikorodu', name: 'Ita-Elewa Road', targetVisits: 9 },
  ],
  routes: [
    { id: 'route-balogun', name: 'Balogun Prime Coverage', marketId: 'market-balogun', streetIds: ['street-broad', 'street-campbell', 'street-herbert'], agentId: 'user-agent-1', supervisorId: 'user-supervisor', startTime: '08:00', endTime: '17:00', completion: 72, status: 'active', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], waypoints: [{ lat: 6.4501, lng: 3.3912 }, { lat: 6.4515, lng: 3.3924 }, { lat: 6.4528, lng: 3.3938 }, { lat: 6.4544, lng: 3.3947 }, { lat: 6.4561, lng: 3.3962 }, { lat: 6.4574, lng: 3.3976 }], history: [{ date: daysOffset(-1), completion: 80, missedStreets: ['Campbell Street'] }, { date: daysOffset(-2), completion: 92, missedStreets: [] }] },
    { id: 'route-yaba', name: 'Yaba Expansion Run', marketId: 'market-yaba', streetIds: ['street-tejuosho', 'street-alagomeji'], agentId: 'user-supervisor', supervisorId: 'user-admin', startTime: '09:00', endTime: '16:00', completion: 56, status: 'active', days: ['Mon', 'Wed', 'Fri'], waypoints: [{ lat: 6.5018, lng: 3.3652 }, { lat: 6.5046, lng: 3.3679 }, { lat: 6.5071, lng: 3.3697 }, { lat: 6.5095, lng: 3.3711 }, { lat: 6.5112, lng: 3.3734 }], history: [{ date: daysOffset(-1), completion: 45, missedStreets: ['Alagomeji'] }] },
  ],
  customers: [
    { id: 'customer-001', name: 'Gold Line Stores', phone: '+2348080001100', marketId: 'market-balogun', streetId: 'street-broad', gps: { lat: 6.4544, lng: 3.3947 }, productInterest: ['Soft Drinks', 'Water'], customerType: 'Distributor', notes: 'Prefers afternoon delivery window.', photo: '', lastVisitAt: daysOffset(0), balance: 42000 },
    { id: 'customer-002', name: 'Mimi Retail Hub', phone: '+2348080002200', marketId: 'market-yaba', streetId: 'street-tejuosho', gps: { lat: 6.5095, lng: 3.3711 }, productInterest: ['Snacks', 'Energy Drinks'], customerType: 'Retailer', notes: 'High conversion on bundle offers.', photo: '', lastVisitAt: daysOffset(-1), balance: 9000 },
    { id: 'customer-003', name: 'Ikorodu Family Mart', phone: '+2348080003300', marketId: 'market-ikorodu', streetId: 'street-itaelewa', gps: { lat: 6.6194, lng: 3.5105 }, productInterest: ['Household', 'Toiletries'], customerType: 'Wholesaler', notes: 'Needs extended credit approval.', photo: '', lastVisitAt: daysOffset(-2), balance: 125000 },
  ],
  attendance: [
    { id: 'attendance-001', userId: 'user-agent-1', clockInAt: daysOffset(0), clockOutAt: '', gps: { lat: 6.4547, lng: 3.3955 }, facePhoto: '', status: 'clocked-in' },
    { id: 'attendance-002', userId: 'user-driver', clockInAt: daysOffset(0), clockOutAt: '', gps: { lat: 6.4501, lng: 3.3912 }, facePhoto: '', status: 'clocked-in' },
  ],
  visits: [
    { id: 'visit-001', customerId: 'customer-001', routeId: 'route-balogun', agentId: 'user-agent-1', checkInAt: daysOffset(0), checkOutAt: '', durationMinutes: 22, proofPhoto: '', gps: { lat: 6.4544, lng: 3.3947 }, notes: 'Discussed weekend promo campaign.', status: 'completed' },
    { id: 'visit-002', customerId: 'customer-002', routeId: 'route-yaba', agentId: 'user-supervisor', checkInAt: daysOffset(-1), checkOutAt: daysOffset(-1), durationMinutes: 16, proofPhoto: '', gps: { lat: 6.5095, lng: 3.3711 }, notes: 'Customer requested POS support.', status: 'completed' },
  ],
  vehicles: [
    { id: 'vehicle-001', plateNumber: 'LND-240AA', name: 'Toyota Hiace Van', driverId: 'user-driver', status: 'active', fuelLevel: 61, odometer: 48215, mileageToday: 62, lastKnownLocation: { lat: 6.4501, lng: 3.3912 }, lastMovementAt: daysOffset(0) },
    { id: 'vehicle-002', plateNumber: 'LND-510BJ', name: 'Kia Bongo', driverId: '', status: 'maintenance', fuelLevel: 28, odometer: 90112, mileageToday: 0, lastKnownLocation: { lat: 6.5244, lng: 3.3792 }, lastMovementAt: daysOffset(-3) },
  ],
  trip_logs: [
    { id: 'trip-001', vehicleId: 'vehicle-001', driverId: 'user-driver', routeId: 'route-balogun', startAt: daysOffset(0), endAt: '', startMileage: 48153, endMileage: 0, fuelPurchased: 18000, inspection: ['Brakes checked', 'Tyres good', 'Lights working'], deliveryProof: '', status: 'active', path: [{ lat: 6.4501, lng: 3.3912 }, { lat: 6.4518, lng: 3.3927 }, { lat: 6.4544, lng: 3.3947 }] },
  ],
  orders: [
    { id: 'order-001', customerId: 'customer-001', agentId: 'user-agent-1', items: [{ name: 'Mineral Crates', quantity: 8, price: 5500 }, { name: 'Energy Drink Cartons', quantity: 4, price: 7200 }], discount: 2500, paymentMethod: 'transfer', paymentStatus: 'partial', total: 69900, paidAmount: 30000, commission: 3495, createdAt: daysOffset(0) },
    { id: 'order-002', customerId: 'customer-002', agentId: 'user-supervisor', items: [{ name: 'Snack Packs', quantity: 20, price: 1400 }], discount: 0, paymentMethod: 'pos', paymentStatus: 'paid', total: 28000, paidAmount: 28000, commission: 1400, createdAt: daysOffset(-1) },
  ],
  payments: [
    { id: 'payment-001', orderId: 'order-001', customerId: 'customer-001', amount: 30000, method: 'transfer', status: 'received', receivedAt: daysOffset(0) },
    { id: 'payment-002', orderId: 'order-002', customerId: 'customer-002', amount: 28000, method: 'pos', status: 'received', receivedAt: daysOffset(-1) },
  ],
  expenses: [
    { id: 'expense-001', category: 'Fuel', amount: 18000, userId: 'user-driver', vehicleId: 'vehicle-001', notes: 'Balogun delivery trip refuel.', createdAt: daysOffset(0) },
    { id: 'expense-002', category: 'Meal', amount: 4500, userId: 'user-agent-1', vehicleId: '', notes: 'Team market coverage allowance.', createdAt: daysOffset(0) },
  ],
  alerts: [
    { id: 'alert-001', type: 'late_clock_in', title: 'Late clock-in risk', description: 'Two field agents clocked in after 08:30 yesterday.', severity: 'medium', status: 'open', createdAt: daysOffset(0), subjectId: 'user-agent-1' },
    { id: 'alert-002', type: 'payment_overdue', title: 'Outstanding collections', description: 'Gold Line Stores has an outstanding balance of NGN 42,000.', severity: 'high', status: 'open', createdAt: daysOffset(0), subjectId: 'customer-001' },
  ],
  tasks: [
    { id: 'task-001', title: 'Verify Tejuosho expansion coverage', description: 'Revisit missed shops and upload photo proof.', assigneeId: 'user-supervisor', createdBy: 'user-admin', dueDate: daysOffset(1), priority: 'high', status: 'in-progress', comments: ['Need final photo uploads before noon.'], attachments: [] },
    { id: 'task-002', title: 'Fleet inspection report', description: 'Complete weekly checklist for all active vehicles.', assigneeId: 'user-driver', createdBy: 'user-admin', dueDate: daysOffset(2), priority: 'medium', status: 'todo', comments: [], attachments: [] },
  ],
  reports: [],
  commissions: [
    { id: 'commission-001', agentId: 'user-agent-1', orderId: 'order-001', amount: 3495, status: 'pending', createdAt: daysOffset(0) },
    { id: 'commission-002', agentId: 'user-supervisor', orderId: 'order-002', amount: 1400, status: 'approved', createdAt: daysOffset(-1) },
  ],
  maintenance_logs: [
    { id: 'maintenance-001', vehicleId: 'vehicle-002', serviceType: 'Brake inspection', cost: 38000, notes: 'Pads replacement scheduled.', serviceDate: daysOffset(-2), nextServiceDate: daysOffset(30) },
  ],
  location_logs: [
    { id: 'loc-001', userId: 'user-agent-1', lat: 6.4544, lng: 3.3947, speed: 0, accuracy: 18, recordedAt: daysOffset(0) },
    { id: 'loc-002', userId: 'user-driver', lat: 6.4501, lng: 3.3912, speed: 24, accuracy: 12, recordedAt: daysOffset(0) },
  ],
  leave_requests: [],
}

export const starterData = {
  users: [
    { id: 'bootstrap-super-admin', name: 'NexFieldForce Super Admin', email: 'admin@nexfieldforce.com', role: 'Super Admin', phone: '+2348000000001', team: 'Leadership', status: 'active', assignedRouteIds: [], assignedVehicleIds: [], clockedIn: false, lastSeen: '', region: 'Lagos', state: 'Lagos', marketId: 'market-balogun', designation: 'Super Admin', createdAt: new Date().toISOString() },
  ],
  markets: starterMarkets,
  streets: starterStreets,
  routes: [],
  customers: [],
  attendance: [],
  visits: [],
  vehicles: [],
  trip_logs: [],
  orders: [],
  payments: [],
  expenses: [],
  alerts: [],
  tasks: [],
  reports: [],
  commissions: [],
  maintenance_logs: [],
  location_logs: [],
  leave_requests: [],
}

export const roleOrder = ['Super Admin', 'Admin', 'Supervisor', 'Field Agent', 'Driver', 'Finance Officer', 'Client', 'Viewer']
export const collectionKeys = Object.keys(seedData)
export const createEmptyState = () =>
  collectionKeys.reduce((accumulator, key) => {
    accumulator[key] = []
    return accumulator
  }, {})

export const createStarterState = () =>
  collectionKeys.reduce((accumulator, key) => {
    const value = starterData[key]
    accumulator[key] = Array.isArray(value) ? [...value] : []
    return accumulator
  }, {})
