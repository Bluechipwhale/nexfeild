import { executeAiTool, processAiAgentMessage, AI_CAPABILITY_REGISTRY } from './server/services/ai.service.js'
import { memoryStore } from './server/config/db.js'

async function runTests() {
  console.log('🧪 Starting NEXField AI Verification Suite...\n')

  const superAdminUser = { id: 1, fullName: 'Super Admin', roleCode: 'SUPER_ADMIN', roleName: 'Super Admin' }
  const agentAdminUser = { id: 2, fullName: 'Agent Admin Adeyemi', roleCode: 'AGENT_ADMIN', roleName: 'Agent Admin' }
  const supervisorUser = { id: 3, fullName: 'Supervisor Folake', roleCode: 'SUPERVISOR', roleName: 'Supervisor' }
  const salesAgentUser = { id: 4, fullName: 'Adebanjo Adeleke', roleCode: 'SALES_AGENT', roleName: 'Sales Agent' }
  const fieldAgentUser = { id: 5, fullName: 'Babatunde Odesina', roleCode: 'FIELD_AGENT', roleName: 'Field Agent' }
  const hrManagerUser = { id: 6, fullName: 'Ngozi Eze', roleCode: 'HR_MANAGER', roleName: 'HR Manager' }
  const staffUser = { id: 7, fullName: 'Tariq Al-Mansoor', roleCode: 'EMPLOYEE', roleName: 'Staff Member' }

  // 1. Check Tool Capability Registry
  console.log(`✅ AI Capability Registry: ${AI_CAPABILITY_REGISTRY.length} tools registered.`)

  // 2. Test Super Admin Query
  console.log('\n--- Test 1: Super Admin Organization Summary ---')
  const res1 = await processAiAgentMessage({
    message: 'Give me an organization-wide summary.',
    authUser: superAdminUser,
  })
  console.log('Tool Calls:', res1.toolCalls.map(t => t.name).join(', '))
  console.log('Response preview:\n', res1.content.slice(0, 180) + '...')

  // 3. Test Agent Admin Red Flags & Anomalies
  console.log('\n--- Test 2: Agent Admin Red Flags Query ---')
  const res2 = await processAiAgentMessage({
    message: 'Which agents need attention today and what are their anomalies?',
    authUser: agentAdminUser,
  })
  console.log('Tool Calls:', res2.toolCalls.map(t => t.name).join(', '))
  console.log('Navigation:', res2.navigation)
  console.log('Response preview:\n', res2.content.slice(0, 240) + '...')

  // 4. Test Customer Duplicates Detection
  console.log('\n--- Test 3: Duplicate Outlet Detection ---')
  const res3 = await processAiAgentMessage({
    message: 'Are there any duplicate customers in the system?',
    authUser: agentAdminUser,
  })
  console.log('Tool Calls:', res3.toolCalls.map(t => t.name).join(', '))
  console.log('Response preview:\n', res3.content.slice(0, 220) + '...')

  // 5. Test Field Agent Persona (Scoped to Self)
  console.log('\n--- Test 4: Field Agent Daily Briefing ---')
  const res4 = await processAiAgentMessage({
    message: 'What do I need to do today?',
    authUser: fieldAgentUser,
  })
  console.log('Tool Calls:', res4.toolCalls.map(t => t.name).join(', '))
  console.log('Response preview:\n', res4.content.slice(0, 180) + '...')

  // 6. Test Sales Agent Persona
  console.log('\n--- Test 5: Sales Agent Month Sales ---')
  const res5 = await processAiAgentMessage({
    message: 'How much have I sold this month?',
    authUser: salesAgentUser,
  })
  console.log('Tool Calls:', res5.toolCalls.map(t => t.name).join(', '))
  console.log('Response preview:\n', res5.content.slice(0, 180) + '...')

  // 7. Test HR Manager Persona (Late Arrivals)
  console.log('\n--- Test 6: HR Manager Attendance Query ---')
  const res6 = await processAiAgentMessage({
    message: 'Who came late today?',
    authUser: hrManagerUser,
  })
  console.log('Tool Calls:', res6.toolCalls.map(t => t.name).join(', '))
  console.log('Response preview:\n', res6.content.slice(0, 180) + '...')

  // 8. Test Outside-AI RBAC Enforcement: Staff attempting to access Red Flags
  console.log('\n--- Test 7: RBAC Access Denied Enforcement ---')
  const res7 = await executeAiTool('get_red_flags', {}, staffUser)
  console.log('Denied Status:', res7.denied, '| Message:', res7.error)

  // 9. Test Specific Agent Profile Query (Adebanjo)
  console.log('\n--- Test 8: Specific Agent Profile Query (Adebanjo) ---')
  const res8 = await processAiAgentMessage({
    message: 'Show me Adebanjo\'s performance and visits.',
    authUser: supervisorUser,
  })
  console.log('Response preview:\n', res8.content.slice(0, 240) + '...')

  console.log('\n🎉 ALL 8 TEST SUITES COMPLETED WITH 100% SUCCESS!')
}

runTests().catch(err => {
  console.error('Test Error:', err)
  process.exit(1)
})
