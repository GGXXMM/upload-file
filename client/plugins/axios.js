
import Vue from 'vue'
import axios from 'axios'
let service = axios.create({
  timeout: 5000,
  // url前缀
  baseURL: '/api'
})
export default({store, redirect}) => {
  // 请求拦截
  service.interceptors.request.use(
    config=>{
      // // 请求加token
      // const token = window.localStorage.getItem(TOKEN_KEY)
      // // 设置url白名单
      // if(token){
      //   config.headers.common['Authorization'] = 'Bearer '+token
      // }
      return config
    },
    err=>{
      return Promise.reject(err)
    }
  )

  // 响应拦截
  service.interceptors.response.use(
    /**
     * Determine the request status by custom code
     * Here is just an example
     * You can also judge the status by HTTP Status Code
     */
    response => {
      const res = response.data
      if (res.code === 200) {
        return res
      } else {
        redirect('/404')
        // if the custom code is not 200, it is judged as an error.
      }
      return Promise.reject(new Error(res.msg || 'Error'))
    },
    error => {
      console.log('err' + error) // for debug

      return Promise.reject(error)
    }
  )
}

Vue.prototype.$http = service;

export const http = service;