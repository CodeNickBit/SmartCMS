import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetService, Asset } from '../../services/asset.service';
import { SharedSidebarComponent } from '../components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-my-assets',
  standalone: true,
  imports: [CommonModule, SharedSidebarComponent, SharedHeaderComponent],
  templateUrl: './my-assets.component.html',
  styleUrls: ['./my-assets.component.css']
})
export class MyAssetsComponent implements OnInit {
  myAssets: Asset[] = [];

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    this.loadMyAssets();
  }

  loadMyAssets() {
    this.assetService.getMyAssets().subscribe({
      next: (data: any) => this.myAssets = data,
      error: (err: any) => console.error('Error fetching my assets', err)
    });
  }
}
