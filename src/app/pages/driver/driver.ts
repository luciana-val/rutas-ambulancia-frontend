import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-driver',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './driver.html',
  styleUrl: './driver.css',
})
export class Driver {}
