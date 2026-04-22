'use client'
import React ,{useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import api from '@/lib/axios'
const useAuth=()=> {
  const[user, setUser]=useState<any> (null)
  const[loading,setLoading]=useState(true)
}
useEffect(()=>{
  const userData=localStorage.getItem('user)'
  if (userData) {
    setUser(JSON.parse(userData))
  }
setLoading(false)
}, [])
return {user, loading}
}
const AcademicSupervisorDashboard =()=>{
  const{user,loading}=useAuth()
  const router=useRouter()
  const [students, setStudents]=useState<any[]>([])
  useEffect(()=>{
     if (user?.role ==='academic_supervisor'){
      setStudents([
        {id:1, name: 'mathas', reg_no: '19/u/985' ,logs_submitted: 8, status: 'On Track'},
        {id : 2, name : 'jane ',reg_no:'44/u/6435',logs_submitted: 3, status:'Behind'},
      ])
     }
  },[user])
  if (loading) return <div classsName="p-6">Loading...</div>
  if (!user) return null
  return (
    <div className="p-6 max-w-7*1 mx-auto">{/*feat:add RBAC stats cards - visible only to supervisors/admin*?</div>
  <div className="mb-8">
  <h1 className="text-3xl font-bold">Academic Supervisor Dashboard</h1>
  <p className ="text-gray-600">Welcome back, {user.name||user.email}</p>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  <div className="bg-white p-6 rounded-lg shadow border">
  <h3 className="text-gray-500 text-sm">Assigned Students</h3>
  <p className="text-3xl font-bold">{students.length}</p>
  </div>
 <div className="bg-white p-6 rounded-lg shadow border">
 <h3 className="text-gray-500 text-sm">Completed assesments</h3>
 <p className="text-3xl font-bold text-green-600">12</p>
 </div>
  </div>
  <div className="bg-white rounded-lg shadow border">
  <div className ="p-4 border-b">
  <h2 className="text-xl font-semibold">My Students</h2>
  </div>
  <table ClassNmae="w-full">
  <thead classNmae="bg-gray-50">
  <tr>
  <th classNmae="text-left p-4">Name</th>
  <th className="text-left p-4">Reg No</th>
  <th className="text-left p-4">logs</th>
  <th className="text-left p-4">Status</th>
  {['academic_supervisor','admin'].includes(user.role)&&(
  <th className="text-left p-4">Actions</th>
    )}
  </tr>
  </thead>
  <tbody>
  {students.map((student:any)=>(
  <tr key={student.id} className="border-t">
  <td className="p-4">{student.name}</td>
  <td className="p-4">{student.reg_no}</td>
  <td className="p-4">{student.logs_submitted}</td>
  <td className="p-4">
<span className={`px-2 py-1 rounded text-sm ${
student.status==='On Track'? ' bg-green-100 text-green-800':'bg-red-100 text-red-800'
}`}>
{student.status}
</span>
</td>
{['academic_supervisor','admin'].includes(user.role)&&(
<td className="p-4 space-x-2">
<button
onClick={()=> router.push(`/dashboard/students/${student.id}`)}
className="text-blue-600 hover:underline"
>
View Logs
</button>
{user.role==='admin'&&(
<button className="text-red-600- hover:underline">Remove</button>
)}
</td>
    )}
</tr>
    ))}
</tbody>
</table>
</div>
</div>
    )
    }
}


export default AcademicSupervisorDashboard
