package com.harvestdirect.app.repository;

import com.harvestdirect.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    
    // Analytics methods
    List<User> findByRole(User.UserRole role);
    long countByRole(User.UserRole role);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = com.harvestdirect.app.model.User.UserRole.FARMER")
    long countFarmers();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = com.harvestdirect.app.model.User.UserRole.FISHERMAN")
    long countFishermen();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = com.harvestdirect.app.model.User.UserRole.WHOLESALER")
    long countWholesalers();
}