import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { visibility, flyInOut, expand } from '../animations/app.animations';
import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import { switchMap } from 'rxjs/operators';
import { ControlContainer, FormBuilder, RequiredValidator, FormGroup, Validators } from '@angular/forms';
import { Comment } from '../shared/comment';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  host: {
    '[@flyInOut]': 'true',
    'style': 'display: block;'
  },
  animations: [
    flyInOut(),
    visibility(),
    expand()
  ]
})

export class DishdetailComponent implements OnInit {

  dish!: Dish | any;
  dishcopy!: Dish | any;
  dishIds!: string[];
  prev!: string;
  next!: string;
  errMess!: string;
  visibility = 'shown';
  

  commentForm!: FormGroup;
  comment!: Comment;
  @ViewChild('cform') commentFormDirective;

  formErrors = {
    'author': '',
    'rating': 5,
    'comment': ''
  }

    /***** Barra de calificación *****/
    formatLabel(rate: number) {
      if (rate >= 1) {
        return Math.round(rate / 1) + '*';
      }
  
      return rate;
    }
    /***** Barra de calificación *****/
  
  validationMessages = {
    'author': {
      'required': "An author's name is rquired",
      'minlenght': 'The name must be at least 2 characters long',
      'maxlenght': 'The name cannot be more than 25 characters long'
    },
    'comment': {
    'required': 'Comment is required',
    'minlenght': 'The comment must be at least 5 characters long',
    'maxlenght': 'The comment cannot be more than 250 characters long'
    }
  };


  constructor(private dishService: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    @Inject('BaseURL') public BaseURL) {
      this.createForm();
    }

  ngOnInit(): void {
    this.dishService.getDishIds()
      .subscribe((dishIds) => this.dishIds = dishIds);
    this.route.params
      .pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishService.getDish(params['id']); } ))
      .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown';
    },
    errmess => this.errMess = <any>errmess);
  }

  setPrevNext(dishId: string) {
    let index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index -1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index +1) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }

  createForm(){
    this.commentForm = this.fb.group({
      author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)]],
      rating: 5,
      comment: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(250)]]
    })

  this.commentForm.valueChanges.subscribe(data => this.onValueChanged(data));

  this.onValueChanged(); /*re-set form validation messages*/

  }

  onValueChanged(data?: any) {
    if (!this.commentForm){ return; }
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
       // clear previous error message (if any)
       this.formErrors[field] = '';
       const control = form.get(field);
       if (control && control.dirty && !control.valid) {
         const messages = this.validationMessages[field];
         for (const key in control.errors) {
           if (control.errors.hasOwnProperty(key)) {
             this.formErrors[field] += messages[key] + ' ';
           }
         }
       }
      }
    }
  }

  onSubmit() {
    this.comment = this.commentForm.value;
    this.comment.date = new Date().toISOString();
    this.dishcopy.comments.push(this.comment);
    this.dishService.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
        errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess});
    this.commentFormDirective.resetForm();
    console.log(this.comment);
    this.commentForm.reset({
      author: '',
      rating: 5,
      comment: ''
    });
    
  }

}
