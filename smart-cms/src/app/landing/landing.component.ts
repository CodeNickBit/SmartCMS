import { Component, AfterViewInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private animationFrameId: number | null = null;
  activeRole: string = 'Admin';
  
  rolesData: Record<string, any> = {
    'Admin': {
      title: 'Unprecedented Oversight',
      desc: 'As an administrator, gain a bird\'s eye view of the entire organization. Monitor high-level KPIs, manage global permissions, and ensure company-wide compliance from a single dashboard.',
      features: [
        'Global Audit Logs & Compliance',
        'Financial Budgeting & Forecasts',
        'System-wide Security Settings'
      ]
    },
    'HR Manager': {
      title: 'Empower Your Workforce',
      desc: 'Streamline onboarding, automate payroll, and monitor employee sentiment. Turn HR from an administrative function into a strategic advantage.',
      features: [
        'Automated Onboarding Workflows',
        'Advanced Analytics & Reporting',
        'Performance & Appraisal Management'
      ]
    },
    'Dept Manager': {
      title: 'Optimize Team Productivity',
      desc: 'Track team bandwidth, approve leave requests instantly, and delegate tasks effectively to ensure your department hits its targets without burnout.',
      features: [
        'Real-time Bandwidth Tracking',
        'One-click Leave Approvals',
        'Resource Allocation Tools'
      ]
    },
    'Employee': {
      title: 'Your Professional Hub',
      desc: 'Access your payslips, request time off, and track your daily tasks through a streamlined, mobile-friendly interface designed for clarity.',
      features: [
        'Self-service Leave Requests',
        'Instant Document Access',
        'Personal Goal Tracking'
      ]
    }
  };

  setRole(role: string) {
    this.activeRole = role;
  }

  private onMouseMove?: (e: MouseEvent) => void;
  private onResize?: () => void;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initCanvas();
      }, 150);
    }
  }

  ngOnDestroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (isPlatformBrowser(this.platformId)) {
      if (this.onMouseMove) window.removeEventListener('mousemove', this.onMouseMove);
      if (this.onResize) window.removeEventListener('resize', this.onResize);
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  initCanvas() {
    const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const hero = document.getElementById('hero');
    if (!hero) return;

    let particles: any[] = [];
    let mouse = { x: -1000, y: -1000 };

    this.onMouseMove = (e: MouseEvent) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', this.onMouseMove);

    const init = () => {
        canvas.width = window.innerWidth;
        canvas.height = hero.offsetHeight;
        particles = [];
        
        // Grid pattern
        const spacing = 40;
        for (let x = 0; x < canvas.width; x += spacing) {
            for (let y = 0; y < canvas.height; y += spacing) {
                particles.push({
                    x: x,
                    y: y,
                    baseX: x,
                    baseY: y,
                    size: 1.5,
                    density: (Math.random() * 20) + 1
                });
            }
        }
    }

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#1A6DC2';
        const heroTop = hero.getBoundingClientRect().top;
        
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            
            // Repelling Physics (Fluid Lerp)
            let dx = mouse.x - p.baseX;
            let dy = (mouse.y - heroTop) - p.baseY;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let maxDistance = 350;

            if (distance < maxDistance && distance > 0) {
                // Taper off the force smoothly
                let force = Math.pow((maxDistance - distance) / maxDistance, 2);
                let pushFactor = 90; // maximum displacement radius
                
                let targetX = p.baseX - (dx / distance) * force * pushFactor;
                let targetY = p.baseY - (dy / distance) * force * pushFactor;
                
                // Lerp towards the displacement target smoothly
                p.x += (targetX - p.x) * 0.1;
                p.y += (targetY - p.y) * 0.1;
                
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Lerp back to origin smoothly at rest
                p.x += (p.baseX - p.x) * 0.05;
                p.y += (p.baseY - p.y) * 0.05;
                
                ctx.globalAlpha = 0.15;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        this.animationFrameId = requestAnimationFrame(animate);
    };

    this.onResize = init;
    window.addEventListener('resize', this.onResize);
    init();
    animate();
  }
}
