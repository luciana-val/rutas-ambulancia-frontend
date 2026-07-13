import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {}
