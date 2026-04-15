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
  )
  
}
const AcademicSupervisorDashboard
 = () => {
  return (
    <div>AcademicSupervisorDashboard
        
    </div>
  )
}

export default AcademicSupervisorDashboard
