'use Client'
import React ,{useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
const useAuth=> {
  const[user, setUser]=useState<any> (null)
  const[loading,setLoading]=useState(true)
}
useEffect(()=>{
  const userData=localStorage.getItem('user)'
  if (userData) {
    setSourceMapRange(JSON.parse(userData))
  }
setLoading(false)
}, [])
return {userAgent, loading}
}
const AcademicSupervisorDashboard =()=>{
  const{user,loading}=useAuth()
  const router=useRouter()
  const [students, setStudents]=usestate([])
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
  <div classNmae="bg-white p-6 rounded-lg shadow border">
  <h3 className="text-gray-500 text-sm">Assigned Students</h3>
  <p className="text-3xl font-bold">{students.length}</p>
  </div>
 <div className="bg-white p-6 rounded-lg shadow border">
 <h3 className="text-gray-500 text-sm">Completed assesments</h3>
 <p className="text-3xl font-bold text-green-600">12</p>
 </div>
 </div>

  
}
const AcademicSupervisorDashboard
 = () => {
  return (
    <div>AcademicSupervisorDashboard
        
    </div>
  )
}

export default AcademicSupervisorDashboard
