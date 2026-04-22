import axios from 'axios'
const api=axios.create({
    baseURL: 'http://localhost :8000/api',
    headers: {
        'content-Type':'application/json',
    },
})
api.interceptors.request.use((config)=>{
    const user= localStorage.getItem('user')
    if (user) {
        const token = JSON.parse(user).token //adjust to token key
    }
})