package org.springframework.samples.petclinic.model;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "users")
public class User implements Persistable<String> {

    @Id
    @Column(name = "username")
    private String username;

    @Column(name = "password")
    private String password;

    @Column(name = "enabled")
    private Boolean enabled;

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "user", fetch = FetchType.EAGER, orphanRemoval = true)
    @NotNull(message = "may not be null")
    @NotEmpty(message = "may not be empty")
    private Set<Role> roles = new HashSet<>();

    // ---- Persistable support ----
    @Transient
    @JsonIgnore
    private boolean isNew = true;

    @PostLoad
    @PostPersist
    void markNotNew() {
        this.isNew = false;
    }

    @Override
    @JsonIgnore
    public String getId() {
        return this.username;
    }

    @Override
    @JsonIgnore
    public boolean isNew() {
        return this.isNew;
    }
    // -----------------------------

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public Set<Role> getRoles() { return roles; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }

    @JsonIgnore
    public void addRole(String roleName) {
        if (this.roles == null) {
            this.roles = new HashSet<>();
        }
        Role role = new Role();
        role.setName(roleName);
        role.setUser(this); // garantir o lado dono
        this.roles.add(role);
    }
}
