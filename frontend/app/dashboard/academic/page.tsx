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
     if (user?.role ==='academic_supervisor'){}
  }
  
}
const AcademicSupervisorDashboard
 = () => {
  return (
    <div>AcademicSupervisorDashboard
        
    </div>
  )
}

export default AcademicSupervisorDashboard
