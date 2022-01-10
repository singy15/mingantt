var testData = [
  {
    taskId: 1,
    categoryId: 1,
    subject: 'Test1',
    planStartDate: '20211218',
    planEndDate: '20211220',
    actualStartDate: '20211218',
    actualEndDate: '20211220',
    assignedUserId: 'James',
    progress: 100,
    planWorkload: 0,
    actualWorkload: 0,
    planWorkloadMap: "",
    content: "asdfg\nllljkl;"
  },
  {
    taskId: 2,
    categoryId: 1,
    subject: 'Test2',
    planStartDate: '20211219',
    planEndDate: '20211223',
    actualStartDate: '20211218',
    actualEndDate: '20211220',
    assignedUserId: 'Alice',
    progress: 90,
    planWorkload: 0,
    actualWorkload: 0,
    planWorkloadMap: "",
    content: ""
  },
  {
    taskId: 3,
    categoryId: 1,
    subject: 'Test3',
    planStartDate: '20211219',
    planEndDate: '20220104',
    actualStartDate: '20211218',
    actualEndDate: '20211220',
    assignedUserId: 'James',
    progress: 40,
    planWorkload: 0,
    actualWorkload: 0,
    planWorkloadMap: "",
    content: ""
  },
  {
    taskId: 4,
    categoryId: 1,
    subject: 'Test4',
    planStartDate: '20211221',
    planEndDate: '20211230',
    actualStartDate: '20211218',
    actualEndDate: '20211220',
    assignedUserId: 'Bob',
    progress: 60,
    planWorkload: 0,
    actualWorkload: 0,
    planWorkloadMap: "",
    content: ""
  },
  {
    taskId: 5,
    categoryId: 1,
    subject: 'Test5',
    planStartDate: '20211225',
    planEndDate: '20220104',
    actualStartDate: '20211218',
    actualEndDate: '20211220',
    assignedUserId: 'Alice',
    progress: 5,
    planWorkload: 0,
    actualWorkload: 0,
    planWorkloadMap: "",
    content: ""
  },
  {
    taskId: 6,
    categoryId: 2,
    subject: 'Test6',
    planStartDate: '20211228',
    planEndDate: '20220108',
    actualStartDate: '20211218',
    actualEndDate: '20211220',
    assignedUserId: 'Alice',
    progress: 0,
    planWorkload: 0,
    actualWorkload: 0,
    planWorkloadMap: "",
    content: ""
  },
];

function encodeDateFormat(dateStr) {
  if((dateStr === "") || (dateStr === 0) || (dateStr === undefined) || (dateStr == null)) {
    return "";
  }

  return dateStr.substring(0,4) + "-" + dateStr.substring(4,6) + "-" + dateStr.substring(6,8);
}

function decodeDateFormat(dateStr) {
  if((dateStr === "") || (dateStr === 0) || (dateStr === undefined) || (dateStr == null)) {
    return "";
  }

  return dateStr.substring(0,4) + dateStr.substring(5,7) + dateStr.substring(8,10);
}

function encodeTask(task) {
  var encoded = {...task};
  encoded.planStartDate = encodeDateFormat(encoded.planStartDate);
  encoded.planEndDate = encodeDateFormat(encoded.planEndDate);
  encoded.actualStartDate = encodeDateFormat(encoded.actualStartDate);
  encoded.actualEndDate = encodeDateFormat(encoded.actualEndDate);
  return encoded;
}

function decodeTask(task) {
  var decoded = {...task};
  decoded.planStartDate = decodeDateFormat(decoded.planStartDate);
  decoded.planEndDate = decodeDateFormat(decoded.planEndDate);
  decoded.actualStartDate = decodeDateFormat(decoded.actualStartDate);
  decoded.actualEndDate = decodeDateFormat(decoded.actualEndDate);
  return decoded;
}

function loadLocalStorage() {
  app.loadTasks(JSON.parse(localStorage.getItem("mingantt/tasks")));
}

function saveLocalStorage() {
  localStorage.setItem("mingantt/tasks", JSON.stringify(app.getTasks()));
  console.log("successfully saved!");
}

var timeoutSaveLocalStorage = null;

const app = Vue.createApp({
  components: {
    "mingantt": mingantt
  },
  methods: {
    loadLocalStorage() {
      this.$refs.mingantt.loadTasks(JSON.parse(localStorage.getItem("mingantt/tasks")));
    },
    saveLocalStorage() {
      localStorage.setItem("mingantt/tasks", JSON.stringify(this.$refs.mingantt.getTasks()));
      console.log("successfully saved!");
    }
  },
  mounted() {
    var self = this;
    this.$refs.mingantt.encodeFn = encodeTask;
    this.$refs.mingantt.decodeFn = decodeTask;
    this.$refs.mingantt.loadTasks(testData);

    // Set auto-save handler
    this.$refs.mingantt.handlerOnUpdateTask = function() {
      if(timeoutSaveLocalStorage) {
        timeoutSaveLocalStorage.clearTimeout();
        timeoutSaveLocalStorage = null;
      }

      timeoutSaveLocalStorage = setTimeout(function() {
        self.saveLocalStorage();
      }, 3000);
    };

  }
}).mount('#app');

