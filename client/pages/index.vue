<template>
  <div>
    <div>
      <h3 class="title">
        普通文件上传
      </h3>
      <div ref="drag" id="drag">
        <input type="file" name="file" @change="handleFileChange">
      </div>
      <el-progress :stroke-width="20"	 :percentage="uploadProgress"></el-progress>
    </div>
    <div>
      <el-button @click="uploadFile">上传</el-button>
    </div>
    <div>
      <p>计算hash的进度</p>
      <el-progress :stroke-width="20"	 :percentage="hashProgess"></el-progress>
    </div>
  </div>
</template>

<script>
import SparkMD5 from 'spark-md5'
const CHUNCK_SIZE = 0.5*1024*1024;
export default {
  data() {
    return {
      file: null,
      uploadProgress: 0,
      hashProgess: 0
    }
  },
  mounted() {
    this.bindEvent()
  },
  methods: {
    async uploadFile() {
      // 格式校验
      // if(!await this.isImage(this.file)) {
      //   console.log('不是图片')
      //   return
      // }else{
      //   console.log('图片格式正确')
      // }
      this.chunks = this.createFileChunk(this.file)
      // const hash = await this.calculateHashWorker()
      const hash = await this.calculateHashIdle()
      console.log('hash', hash)
      // const form = new FormData();
      // form.append('name', this.file.name);
      // form.append('file', this.file);

      // this.$http.post('/uploadfile', form, {
      //   onUploadProgress: progress => {
      //     this.uploadProgress = Number(((progress.loaded/progress.total)*100).toFixed(2))
      //   }
      // })
    },
    // 文件切片
    createFileChunk(file, size=CHUNCK_SIZE) {
      let chunks = [];
      let cur = 0;
      while(cur<this.file.size) {
        chunks.push({index: cur, file: this.file.slice(cur, cur+size)})
        cur+=size
      }
      return chunks
    },
    // webWorker多线程计算hash
    async calculateHashWorker() {
      return new Promise(resolve => {
        this.worker = new Worker('/hash.js');
        this.worker.postMessage({chunks: this.chunks})
        this.worker.onmessage = e => {
          const {progress, hash} = e.data;
          this.hashProgess = Number(progress.toFixed(2))
          if(hash) {
            resolve(hash)
          }
        }
      })
    },
    // 时间切片计算hash
    async calculateHashIdle() {
      const chunks = this.chunks;
      return new Promise(resolve => {
        const spark = new SparkMD5.ArrayBuffer();
        let count = 0;

        const appendToSpark = async file => {
          return new Promise(resolve=>{
            const reader = new FileReader()
            reader.readAsArrayBuffer(file)
            reader.onload = e=>{
              spark.append(e.target.result)
              resolve()
            }
          })
        }

        const workLoop = async deadline => {
          // timeRemaining获取当前帧的剩余时间
          while(count<chunks.length && deadline.timeRemaining()>1) {
            // 有空闲时间，且有任务
            await appendToSpark(chunks[count].file);
            count++;
            if(count<chunks.length) {
              // 计算中
              this.hashProgess = Number(
                ((100*count)/chunks.length).toFixed(2)
              )
            }else {
              this.hashProgess = 100;
              resolve(spark.end())
            }
          }
          window.requestIdleCallback(workLoop)
        }
        // 浏览器一旦空闲，就会调用workLoop
        window.requestIdleCallback(workLoop)
      })
    },
    async blobToString(blob){
      return new Promise(resolve=> {
        const reader = new FileReader();
        reader.onload = function() {
          console.log(reader.result)
          const ret = reader.result.split('')
                        .map(v=> v.charCodeAt())
                        .map(v=>v.toString(16).toUpperCase())
                        .join('')
          resolve(ret)
        }
        reader.readAsBinaryString(blob);
      })
    },
    async isGif(file){
      // GIF89a 和 GIF87a（2种gif图片规范）
      // 47 49 46 38 39 61 || 47 49 46 38 37 61
      // 前6个字节
      const ret = await this.blobToString(file.slice(0,6));
      console.log(ret)
      const isGif = (ret == '47 49 46 38 39 61') || (ret == '47 49 46 38 37 61');
      return isGif;
    },
    async isPng(file) {
      // 前8个字节
      const ret = await this.blobToString(file.slice(0,8));
      const isPng = (ret == '89 50 4E 47 0D 0A 1A 0A');
      return isPng;
    },
    async isJpg(file) {
      // 头2个字节、结尾2个字节
      const len = file.size;
      const start = await this.blobToString(file.slice(0,2));
      const tail = await this.blobToString(file.slice(-2));
      const isJpg = (start == 'FF D8') && (tail == 'FF D9');
      return isJpg;
    },
    // 判断图片格式
    async isImage(file) {
      return await this.isGif(file) || await this.isPng(file) || await this.isJpg(file)
    },
    handleFileChange(e) {
      const [file] = e.target.files;
      if(!file) return;
      this.file = file;
    },
    bindEvent() {
      const drag = this.$refs.drag;
      drag.addEventListener('dragover', e => {
        drag.style.borderColor = 'red';
        e.preventDefault();
      })
      drag.addEventListener('dragleave', e => {
        drag.style.borderColor = '#eee';
        e.preventDefault();
      })
      drag.addEventListener('drop', e => {
        const fileList = e.dataTransfer.files;
        this.file = fileList[0];
        e.preventDefault();
      })
    }
  },
}
</script>

<style>
.title {
  font-family:
    'Quicksand',
    'Source Sans Pro',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  display: block;
  font-weight: 300;
  font-size: 30px;
  color: #35495e;
  letter-spacing: 1px;
}
#drag {
  height: 100px;
  line-height: 100px;
  border: 2px dashed #ddd;
  text-align: center;
}
</style>