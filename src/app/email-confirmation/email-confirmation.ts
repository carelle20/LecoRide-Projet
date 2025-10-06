import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-email-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-confirmation.html',
  styleUrls: ['./email-confirmation.scss']
})
export class EmailConfirmation {
  userEmail: string | null = null; 

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      this.userEmail = params['email'] || null;
    });
  }

}

