const app = Vue.createApp({
  data() {
    return {
      start_month: '2021-10',
      end_month: '2022-02',
      block_size: 30,
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
          name: 'テストA',
          collapsed: false,
        }, {
          taskId: 2,
          name: 'テストB',
          collapsed: false,
        }
      ],
      tasks: [
        {
          taskId: 1,
          categoryId: 1,
          name: 'テスト1',
          startDate: '2021-12-18',
          endDate: '2021-12-20',
          actualStartDate: '2021-12-18',
          actualEndDate: '2021-12-20',
          assignedUserId: '鈴木',
          percentage: 100,
        },
        {
          taskId: 2,
          categoryId: 1,
          name: 'テスト2',
          startDate: '2021-12-19',
          endDate: '2021-12-23',
          actualStartDate: '2021-12-18',
          actualEndDate: '2021-12-20',
          assignedUserId: '佐藤',
          percentage: 90,
        },
        {
          taskId: 3,
          categoryId: 1,
          name: 'テスト3',
          startDate: '2021-12-19',
          endDate: '2022-01-04',
          actualStartDate: '2021-12-18',
          actualEndDate: '2021-12-20',
          assignedUserId: '鈴木',
          percentage: 40,
        },
        {
          taskId: 4,
          categoryId: 1,
          name: 'テスト4',
          startDate: '2021-12-21',
          endDate: '2021-12-30',
          actualStartDate: '2021-12-18',
          actualEndDate: '2021-12-20',
          assignedUserId: '山下',
          percentage: 60,
        },
        {
          taskId: 5,
          categoryId: 1,
          name: 'テスト5',
          startDate: '2021-12-25',
          endDate: '2022-01-04',
          actualStartDate: '2021-12-18',
          actualEndDate: '2021-12-20',
          assignedUserId: '佐藤',
          percentage: 5,
        },
        {
          taskId: 6,
          categoryId: 2,
          name: 'テスト6',
          startDate: '2021-12-28',
          endDate: '2022-01-08',
          actualStartDate: '2021-12-18',
          actualEndDate: '2021-12-20',
          assignedUserId: '佐藤',
          percentage: 0,
        },
      ],
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
        name: '',
        startDate: '',
        endDate: '',
        actualStartDate: '',
        actualEndDate: '',
        assignedUserId: '',
        percentage: 0
      },
      update_mode: false
    }
  },
  methods:{
    getDays(year, month, block_number) {
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
      let days = [];
      let date = moment(`${year}-${month}-01`);
      let num = date.daysInMonth();
      for (let i = 0; i < num; i++) {
        days.push({
          day: date.date(),
          dayOfWeek: dayOfWeek[date.day()],
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
          date: start_month.format('YYYY年MM月'),
          year: start_month.year(),
          month: start_month.month(), //month(), 0,1..11と表示
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
          let startDate = moment(task.startDate).add(-days, 'days')
          let endDate = moment(task.endDate).add(-days, 'days')
          task['startDate'] = startDate.format('YYYY-MM-DD')
          task['endDate'] = endDate.format('YYYY-MM-DD')
        } else {
          this.element.style.left = `${this.left.replace('px', '')}px`;
        }
      }
      if (this.leftResizing) {
        let diff = this.pageX - event.pageX;
        let days = Math.ceil(diff / this.block_size)
        if (days !== 0) {
          let task = this.tasks.find(task => task.taskId === this.task_id);
          let startDate = moment(task.startDate).add(-days, 'days')
          let endDate = moment(task.endDate)
          if (endDate.diff(startDate, 'days') <= 0) {
            task['startDate'] = endDate.format('YYYY-MM-DD')
          } else {
            task['startDate'] = startDate.format('YYYY-MM-DD')
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
          let endDate = moment(task.endDate).add(-days, 'days')
          task['endDate'] = endDate.format('YYYY-MM-DD')
        } else {
          let task = this.tasks.find(task => task.taskId === this.task_id);
          let startDate = moment(task.startDate);
          let endDate = moment(task.endDate).add(-days, 'days')
          if (endDate.diff(startDate, 'days') < 0) {
            task['endDate'] = startDate.format('YYYY-MM-DD')
          } else {
            task['endDate'] = endDate.format('YYYY-MM-DD')
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
      return this.inner_height - this.task_height - 48 - 20;
    },
    scrollDistance() {
      let startDate = moment(this.start_month);
      let between_days = this.today.diff(startDate, 'days')
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
      let startDate = moment(this.start_month);
      let top = 10;
      let left;
      let between;
      let start;
      let style;
      return this.displayTasks.map(task => {
        style = {}
        if(task.cat==='task'){
          let date_from = moment(task.startDate);
          let date_to = moment(task.endDate);
          between = date_to.diff(date_from, 'days');
          between++;
          start = date_from.diff(startDate, 'days');
          left = start * this.block_size;
          style = {
            top: `${top}px`,
            left: `${left}px`,
            width: `${this.block_size * between}px`,
          }
        }
        top = top + 40;
        return {
          style,
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

