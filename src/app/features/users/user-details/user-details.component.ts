import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { UserService } from '../../../core/services/user.service';
import { User, UserRole } from '../../../core/models/user.model';

@Component({
    selector: 'app-user-details',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule
    ],
    templateUrl: './user-details.component.html',
    styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private userService = inject(UserService);
    UserRole = UserRole;

    user: User | undefined;

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            const numericId = parseInt(id, 10);
            if (!isNaN(numericId)) {
                this.userService.getUserById(numericId).subscribe({
                    next: (data) => {
                        if (data) {
                            this.user = data;
                        } else {
                            console.error('User not found');
                            this.router.navigate(['/users']);
                        }
                    },
                    error: (err) => {
                        console.error('Error fetching user', err);
                        this.router.navigate(['/users']);
                    }
                });
            } else {
                console.error('Invalid user ID');
                this.router.navigate(['/users']);
            }
        }
    }

    goBack() {
        this.router.navigate(['/users']);
    }
}
