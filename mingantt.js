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
    content: ""
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

function encodeTask(task) {
  var encoded = {...task};
  encoded.planStartDate = encoded.planStartDate.substring(0,4) + "-" + encoded.planStartDate.substring(4,6) + "-" + encoded.planStartDate.substring(6,8);
  encoded.planEndDate = encoded.planEndDate.substring(0,4) + "-" + encoded.planEndDate.substring(4,6) + "-" + encoded.planEndDate.substring(6,8);
  encoded.actualStartDate = encoded.actualStartDate.substring(0,4) + "-" + encoded.actualStartDate.substring(4,6) + "-" + encoded.actualStartDate.substring(6,8);
  encoded.actualEndDate = encoded.actualEndDate.substring(0,4) + "-" + encoded.actualEndDate.substring(4,6) + "-" + encoded.actualEndDate.substring(6,8);
  return encoded;
}

function decodeTask(task) {
  var decoded = {...task};
  decoded.planStartDate = decoded.planStartDate.substring(0,4) + decoded.planStartDate.substring(5,7) + decoded.planStartDate.substring(8,10);
  decoded.planEndDate = decoded.planEndDate.substring(0,4) + decoded.planEndDate.substring(5,7) + decoded.planEndDate.substring(8,10);
  decoded.actualStartDate = decoded.actualStartDate.substring(0,4) + decoded.actualStartDate.substring(5,7) + decoded.actualStartDate.substring(8,10);
  decoded.actualEndDate = decoded.actualEndDate.substring(0,4) + decoded.actualEndDate.substring(5,7) + decoded.actualEndDate.substring(8,10);
  return decoded;
}

const app = Vue.createApp({
  data() {
    return {
      start_month: '2021-10',
      end_month: '2022-02',
      block_size: 24,
      block_number: 0,
      calendars:[],
      inner_width: '',
      inner_height: '',
      task_width: '',
      task_height: '',
      today:moment(),
      categories: [
        {
          taskId: 1,
          subject: 'Category1',
          collapsed: false,
        }, {
          taskId: 2,
          subject: 'Category2',
          collapsed: false,
        }
      ],
      tasks: [],
      position_id: 0,
      dragging:false,
      pageX:'',
      elememt:'',
      left:'',
      task_id:'',
      width:'',
      leftResizing:false,
      rightResizing:false,
      task: '',
      show: false,
      form: {
        categoryId: '',
        taskId: '',
        subject: '',
        planStartDate: '',
        planEndDate: '',
        actualStartDate: '',
        actualEndDate: '',
        assignedUserId: '',
        progress: 0,
        planWorkload: 0,
        actualWorkload: 0,
        planWorkloadMap: "",
        content: ""
      },
      update_mode: false,
      encodeFn: null,
      decodeFn: null
    }
  },
  methods:{
    loadTasks(tasks) {
      if(this.encodeFn) {
        this.tasks = tasks.map(this.encodeFn);
      } else {
        this.tasks = tasks;
      }
    },
    getDays(year, month, block_number) {
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      let days = [];
      let date = moment(`${year}-${month}-01`);
      let num = date.daysInMonth();
      for (let i = 0; i < num; i++) {
        days.push({
          day: date.date(),
          dayOfWeek: date.day(),
          dayOfWeekStr: dayOfWeek[date.day()],
          block_number
        })
        date.add(1, 'day');
        block_number++;
      }
      return days;
    },
    getCalendar() {
      let block_number = 0;
      let days;
      let start_month = moment(this.start_month)
      let end_month = moment(this.end_month)
      let between_month = end_month.diff(start_month, 'months')
      for (let i = 0; i <= between_month; i++) {
        days = this.getDays(start_month.year(), start_month.format('MM'), block_number);
        this.calendars.push({
          date: start_month.format('YYYY/MM'),
          year: start_month.year(),
          month: start_month.month(),
          start_block_number: block_number,
          calendar: days.length,
          days: days
        })
        start_month.add(1, 'months')
        block_number = days[days.length - 1].block_number
        block_number++;
      }
      return block_number;
    },
    getWindowSize() {
      this.inner_width = window.innerWidth;
      this.inner_height = window.innerHeight;
      this.task_width = this.$refs.task.offsetWidth;
      this.task_height = this.$refs.task.offsetHeight;
    },
    todayPosition() {
      this.$refs.calendar.scrollLeft = this.scrollDistance
    },
    windowSizeCheck() {
      let height = this.lists.length - this.position_id
      if (event.deltaY > 0 && height * 40 > this.calendarViewHeight) {
        this.position_id++
      } else if (event.deltaY < 0 && this.position_id !== 0) {
        this.position_id--
      }
    },
    mouseDownMove(task){
      this.dragging = true;
      this.pageX = event.pageX;
      this.element = event.target;
      this.left = event.target.style.left;
      this.task_id = task.taskId
      console.log('mouseDownMove')
    },
    mouseMove() {
      if (this.dragging) {
        let diff = this.pageX - event.pageX;
        this.element.style.left = `${parseInt(this.left.replace('px', '')) - diff}px`;
      }
    },
    stopDrag(){
      if (this.dragging) {
        let diff = this.pageX - event.pageX
        let days = Math.ceil(diff / this.block_size)
        if (days !== 0) {
          console.log(days)
          let task = this.tasks.find(task => task.taskId === this.task_id);
          let planStartDate = moment(task.planStartDate).add(-days, 'days')
          let planEndDate = moment(task.planEndDate).add(-days, 'days')
          task['planStartDate'] = planStartDate.format('YYYY-MM-DD')
          task['planEndDate'] = planEndDate.format('YYYY-MM-DD')
        } else {
          this.element.style.left = `${this.left.replace('px', '')}px`;
        }
      }
      if (this.leftResizing) {
        let diff = this.pageX - event.pageX;
        let days = Math.ceil(diff / this.block_size)
        if (days !== 0) {
          let task = this.tasks.find(task => task.taskId === this.task_id);
          let planStartDate = moment(task.planStartDate).add(-days, 'days')
          let planEndDate = moment(task.planEndDate)
          if (planEndDate.diff(planStartDate, 'days') <= 0) {
            task['planStartDate'] = planEndDate.format('YYYY-MM-DD')
          } else {
            task['planStartDate'] = planStartDate.format('YYYY-MM-DD')
          }
        } else {
          this.element.style.width = this.width;
          this.element.style.left = `${this.left.replace('px', '')}px`;
        }
      }
      if (this.rightResizing) {
        let diff = this.pageX - event.pageX;
        let days = Math.ceil(diff / this.block_size)
        if (days === 1) {
          this.element.style.width = `${parseInt(this.width.replace('px', ''))}px`;
        } else if (days <= 2) {
          days--;
          let task = this.tasks.find(task => task.taskId === this.task_id);
          let planEndDate = moment(task.planEndDate).add(-days, 'days')
          task['planEndDate'] = planEndDate.format('YYYY-MM-DD')
        } else {
          let task = this.tasks.find(task => task.taskId === this.task_id);
          let planStartDate = moment(task.planStartDate);
          let planEndDate = moment(task.planEndDate).add(-days, 'days')
          if (planEndDate.diff(planStartDate, 'days') < 0) {
            task['planEndDate'] = planStartDate.format('YYYY-MM-DD')
          } else {
            task['planEndDate'] = planEndDate.format('YYYY-MM-DD')
          }
        }
      }
      this.dragging = false;
      this.leftResizing = false;
      this.rightResizing = false;
    },
    mouseDownResize(task, direction) {
      direction === 'left' ? this.leftResizing = true : this.rightResizing = true;
      this.pageX = event.pageX;
      this.width = event.target.parentElement.style.width;
      this.left = event.target.parentElement.style.left;
      this.element = event.target.parentElement;
      this.task_id = task.taskId
    },
    mouseResize() {
      if (this.leftResizing) {
        let diff = this.pageX - event.pageX
        if (parseInt(this.width.replace('px', '')) + diff > this.block_size) {
          this.element.style.width = `${parseInt(this.width.replace('px', '')) + diff}px`
          this.element.style.left = `${this.left.replace('px', '') - diff}px`;
        }
      }
      if (this.rightResizing) {
        let diff = this.pageX - event.pageX;
        if (parseInt(this.width.replace('px', '')) - diff > this.block_size) {
          this.element.style.width = `${parseInt(this.width.replace('px', '')) - diff}px`
        }
      }
    },
    dragTask(dragTask) {
      this.task = dragTask;
    },
    dragTaskOver(overTask) {
      let deleteIndex;
      let addIndex;
      if (this.task.cat !== 'category') {
        if (overTask.cat === 'category') {
          let updateTask = this.tasks.find(task => task.taskId === this.task.taskId)
          updateTask['categoryId'] = overTask['taskId']
        } else {
          if (overTask.taskId !== this.task.taskId) {
            this.tasks.map((task, index) => { if (task.taskId === this.task.taskId) deleteIndex = index })
            this.tasks.map((task, index) => { if (task.taskId === overTask.taskId) addIndex = index })
            this.tasks.splice(deleteIndex, 1)
            this.task['categoryId'] = overTask['categoryId']
            this.tasks.splice(addIndex, 0, this.task)
          }
        }
      }
    },
    toggleCategory(task_id) {
      let category = this.categories.find(category => category.taskId === task_id)
      category['collapsed'] = !category['collapsed'];
    },
    addTask() {
      this.update_mode = false;
      this.form = {}
      this.show = true;
    },
    saveTask() {
      this.tasks.push(
        this.form
      )
      this.form = {}
      this.show = false
    },
    editTask(task){
      this.update_mode=true;
      this.show = true;
      Object.assign(this.form, task);
    },
    updateTask(taskId) {
      let task = this.tasks.find(task => task.taskId === taskId);
      Object.assign(task, this.form);
      this.form = {}
      this.show = false;
    },
    deleteTask(taskId) {
      let delete_index;
      this.tasks.map((task, index) => {
        if (task.taskId === taskId) delete_index = index;
      })
      this.tasks.splice(delete_index, 1)
      this.form = {}
      this.show = false;
    },
  },
  mounted() {
    this.getCalendar();
    this.getWindowSize();
    window.addEventListener('resize', this.getWindowSize);
    window.addEventListener('wheel', this.windowSizeCheck);
    window.addEventListener('mousemove', this.mouseMove);
    window.addEventListener('mousemove', this.mouseResize);
    window.addEventListener('mouseup', this.stopDrag);
    this.$nextTick(() => {
      this.todayPosition();
    });
  },
  computed: {
    calendarViewWidth() {
      return this.inner_width - this.task_width;
    },
    calendarViewHeight() {
      return this.inner_height - this.task_height - 48 - 60;
    },
    scrollDistance() {
      let planStartDate = moment(this.start_month);
      let between_days = this.today.diff(planStartDate, 'days')
      return (between_days + 1) * this.block_size - this.calendarViewWidth / 2;
    },
    lists() {
      let lists = [];
      this.categories.map(category => {
        lists.push({ cat: 'category', ...category });
        this.tasks.map(task => {
          if (task.categoryId === category.taskId && !category.collapsed) {
            lists.push({ cat: 'task', ...task })
          }
        })
      })
      return lists;
    },
    taskBars() {
      let planStartDate = moment(this.start_month);
      let top = 2 + 20;
      let left;
      let leftAc;
      let between;
      let betweenAc;
      let start;
      let startAc;
      let style;
      let actualStyle;
      return this.displayTasks.map(task => {
        style = {}
        if(task.cat==='task'){
          let date_from = moment(task.planStartDate);
          let date_to = moment(task.planEndDate);
          let ac_date_from = moment(task.actualStartDate);
          let ac_date_to = moment(task.actualEndDate);
          between = date_to.diff(date_from, 'days');
          between++;
          betweenAc = ac_date_to.diff(ac_date_from, 'days');
          betweenAc++;
          start = date_from.diff(planStartDate, 'days');
          startAc = ac_date_from.diff(planStartDate, 'days');
          left = start * this.block_size - 1;
          leftAc = startAc * this.block_size - 1;
          style = {
            top: `${top}px`,
            left: `${left}px`,
            width: `${this.block_size * between + 1}px`,
          };
          actualStyle = {
            top: `${top+7}px`,
            left: `${leftAc}px`,
            width: `${this.block_size * betweenAc + 1}px`,
          };
        }
        top = top + 20;
        return {
          style,
          actualStyle,
          task
        }
      })
    },
    displayTasks() {
      let display_task_number = Math.floor(this.calendarViewHeight / 40);
      return this.lists.slice(this.position_id, this.position_id + display_task_number);
    },
  }

}).mount('#app');


// DEBUG
app.encodeFn = encodeTask;
app.decodeFn = decodeTask;
app.loadTasks(testData);

