package org.springframework.samples.petclinic.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.samples.petclinic.model.User;
import org.springframework.samples.petclinic.model.Role;
import org.springframework.samples.petclinic.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void saveUser(User user) {
        // valida mínimo exigido pelo bean validation
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            throw new IllegalArgumentException("User must have at least one role");
        }

        // normaliza roles e garante a relação bidirecional
        user.getRoles().forEach(role -> {
            String name = role.getName();
            if (name != null && !name.startsWith("ROLE_")) {
                role.setName("ROLE_" + name);
            }
            if (role.getUser() == null) {
                role.setUser(user);
            }
        });

        // persiste (agora usando persist por causa de Persistable#isNew)
        userRepository.save(user);
    }
}

