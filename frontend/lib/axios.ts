import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use((config: any) => {
    const user = localStorage.getItem('user')
    if (user) {
        const token = JSON.parse(user).token
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default api