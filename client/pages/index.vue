<template>
  <div>
    <div>
      <h3 class="title">
        普通文件上传
      </h3>
      <div ref="drag" id="drag">
        <input type="file" name="file" @change="handleFileChange">
      </div>
      
    </div>
    <div>
      <el-button @click="uploadFile">上传</el-button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      file: null
    }
  },
  mounted() {
    this.bindEvent()
  },
  methods: {
    uploadFile() {
      const form = new FormData();
      form.append('name', this.file.name);
      form.append('file', this.file);

      this.$http.post('/uploadfile', form)

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